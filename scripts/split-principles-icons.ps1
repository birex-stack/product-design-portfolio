Add-Type -AssemblyName System.Drawing

function Test-IsBackgroundPixel($color) {
  $r = $color.R
  $g = $color.G
  $b = $color.B
  $a = $color.A
  if ($a -lt 16) { return $true }
  $max = [Math]::Max($r, [Math]::Max($g, $b))
  $min = [Math]::Min($r, [Math]::Min($g, $b))
  $avg = ($r + $g + $b) / 3
  if ($avg -gt 235 -and ($max - $min) -lt 18) { return $true }
  if ($avg -gt 210 -and ($max - $min) -lt 10) { return $true }
  return $false
}

function Remove-BackgroundAndTrim($bitmap) {
  $width = $bitmap.Width
  $height = $bitmap.Height
  $minX = $width
  $minY = $height
  $maxX = 0
  $maxY = 0

  for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
      $pixel = $bitmap.GetPixel($x, $y)
      if (Test-IsBackgroundPixel $pixel) {
        $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      } else {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt $minX -or $maxY -lt $minY) {
    return $bitmap
  }

  $cropW = $maxX - $minX + 1
  $cropH = $maxY - $minY + 1
  $cropped = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($cropped)
  $graphics.DrawImage($bitmap, (New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)), $minX, $minY, $cropW, $cropH, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()
  $bitmap.Dispose()
  return $cropped
}

function Add-Padding($bitmap, $padLeft, $padTop, $padRight, $padBottom) {
  $newW = $bitmap.Width + $padLeft + $padRight
  $newH = $bitmap.Height + $padTop + $padBottom
  $padded = New-Object System.Drawing.Bitmap($newW, $newH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($padded)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.DrawImage($bitmap, $padLeft, $padTop)
  $graphics.Dispose()
  $bitmap.Dispose()
  return $padded
}

$src = 'C:\Users\macie\.cursor\projects\c-Users-macie-product-design-portfolio\assets\c__Users_macie_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_icons-fd01462b-1e79-43c6-bd1f-cdb83140b38b.png'
$outDir = 'C:\Users\macie\product-design-portfolio\public\images\principles'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$names = @(
  'understanding',
  'research',
  'clarity',
  'cognitive-load',
  'collaborate',
  'validate',
  'simplify',
  'measure'
)

$img = [System.Drawing.Image]::FromFile($src)
$cols = 4
$rows = 2
$cellW = [int]($img.Width / $cols)
$cellH = [int]($img.Height / $rows)
$insetX = [int]($cellW * 0.1)
$insetYTop = [int]($cellH * 0.06)
$iconRegionH = [int]($cellH * 0.72)

for ($i = 0; $i -lt $names.Length; $i++) {
  $col = $i % $cols
  $row = [int][math]::Floor($i / $cols)
  $x = ($col * $cellW) + $insetX
  $y = ($row * $cellH) + $insetYTop
  $w = $cellW - (2 * $insetX)
  $h = $iconRegionH - $insetYTop

  $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
  $bitmap = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()

  $trimmed = Remove-BackgroundAndTrim $bitmap
  $final = Add-Padding $trimmed 2 2 2 10
  $outPath = Join-Path $outDir ($names[$i] + '.png')
  $final.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "$($names[$i]): $($final.Width)x$($final.Height)"
  $final.Dispose()
}

$img.Dispose()
Write-Output 'Done'
