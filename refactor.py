import os
import re

files = [
    'components/ui/Input.tsx',
    'components/ui/Text.tsx',
    'components/layout/EmptyState.tsx',
    'components/ui/Screen.tsx',
    'components/ui/Card.tsx',
    'components/layout/LoadingSpinner.tsx',
    'app/photos.tsx',
    'app/analytics.tsx',
    'app/setup.tsx',
    'app/(tabs)/_layout.tsx',
    'app/(tabs)/index.tsx',
    'app/(tabs)/wardrobe.tsx',
    'app/(tabs)/outfits.tsx',
    'app/outfit/[id].tsx',
    'app/(tabs)/profile.tsx'
]

base_dir = '/Users/macbook/Desktop/work/salistech/mobile/fitwise'

def process_file(file_path):
    full_path = os.path.join(base_dir, file_path)
    if not os.path.exists(full_path):
        return
        
    with open(full_path, 'r') as f:
        content = f.read()
        
    # Check if THEME is imported from @/lib/theme
    if "import { THEME }" in content or "import { THEME," in content or ", THEME }" in content or "import { THEME" in content:
        # replace import
        content = content.replace("import { THEME } from '@/lib/theme';", "import { useTheme } from '@/lib/theme';")
        content = content.replace("import { THEME,", "import { useTheme,")
        content = content.replace(", THEME }", ", useTheme }")
        
        # replace StyleSheet.create
        content = re.sub(r'const styles = StyleSheet\.create\({', r'const makeStyles = (theme: any) => StyleSheet.create({', content)
        
        # replace THEME. with theme.
        content = content.replace("THEME.", "theme.")
        
        # inject hook into components
        # looking for export function Name(...) { or export default function Name(...) {
        # Note: some have multiline arguments
        def replacer(match):
            return match.group(0) + "\n  const { theme } = useTheme();\n  const styles = makeStyles(theme);"
            
        content = re.sub(r'export (default )?function \w+\([^{]*\) \{', replacer, content)
        
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"Refactored {file_path}")

for file_path in files:
    process_file(file_path)
