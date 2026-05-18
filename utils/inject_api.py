import os
import glob

workspace = r"c:\Users\Asus\Documents\program\KATA-KITA"

html_files = glob.glob(os.path.join(workspace, "pages", "*.html"))
html_files.append(os.path.join(workspace, "index.html"))

for file_path in html_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Determine relative path for js/api.js
    if "pages" in file_path:
        api_script = '<script src="../js/api.js"></script>\n    <script src="../js/main.js"'
        main_script = '<script src="../js/main.js"'
    else:
        api_script = '<script src="js/api.js"></script>\n    <script src="js/main.js"'
        main_script = '<script src="js/main.js"'

    if "api.js" not in content and main_script in content:
        content = content.replace(main_script, api_script)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Injected into {os.path.basename(file_path)}")
    elif "api.js" not in content:
         # fallback inject before </body>
         if "pages" in file_path:
             api_script = '<script src="../js/api.js"></script>\n</body>'
         else:
             api_script = '<script src="js/api.js"></script>\n</body>'
         content = content.replace('</body>', api_script)
         with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
         print(f"Injected into {os.path.basename(file_path)} (fallback)")
