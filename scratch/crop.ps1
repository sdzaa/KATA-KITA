Add-Type -AssemblyName System.Drawing
$srcPath = "c:\Users\User\Documents\KATA-KITA (OPSI)\images\brand-logo.png"
$destPath = "c:\Users\User\Documents\KATA-KITA (OPSI)\images\logo-only.png"

$img = [System.Drawing.Image]::FromFile($srcPath)
$width = $img.Width
$height = $img.Height
Write-Output "Original Size: $width x $height"

# The logo is on the left. Let's crop only the left portion.
# Usually the left portion of a 2:1 landscape logo image is the first 45% or 50% of the width.
# Let's crop from x=0, y=0 to width = 450 (if width is ~1000) or similar.
# Let's crop precisely.
# Let's define the crop rectangle:
# X = 50 to 450, Y = 50 to height-50
$cropWidth = [int]($width * 0.46)
$cropHeight = $height

$bmp = New-Object System.Drawing.Bitmap($cropWidth, $cropHeight)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $cropWidth, $cropHeight)), (New-Object System.Drawing.Rectangle(0, 0, $cropWidth, $cropHeight)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()

Write-Output "Successfully saved cropped logo to $destPath"
