Add-Type -AssemblyName System.Drawing
foreach ($f in Get-ChildItem 'images\Group*.png') {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    Write-Output ($f.Name + ': ' + $img.Width + 'x' + $img.Height)
    $img.Dispose()
}
