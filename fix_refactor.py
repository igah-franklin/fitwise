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
        
    # Remove previously injected hooks to prevent duplicates
    content = content.replace("  const { theme } = useTheme();\n  const styles = makeStyles(theme);\n", "")
    content = content.replace("  const { theme } = useTheme();\n", "")
    
    # Inject hook safely at the beginning of the function body block.
    # The function body starts with { after the arguments.
    # We find export function or export default function
    
    pattern = r'(export (?:default )?function [A-Z][a-zA-Z0-9]*\([^)]*\)[^\{]*\{)'
    
    # some functions have multiple { inside arguments like ({ a = {} }: Props)
    # This is tricky. A more reliable way is to find `return (` or `const ` and insert before it?
    # No, let's just use regex to find export function ... {
    
    # regex for export [default] function Name(any characters until ") {") 
    # but wait, TSX can have `) {`
    def replacer(match):
        return match.group(1) + "\n  const { theme } = useTheme();\n  const styles = makeStyles(theme);"
        
    content = re.sub(r'(export (?:default )?function [A-Z][a-zA-Z0-9]*\([\s\S]*?\)\s*\{)', replacer, content)
    
    # special fix for `app/(tabs)/_layout.tsx` since it doesn't use `makeStyles` actually,
    # wait, if it doesn't use makeStyles, `const styles = makeStyles(theme)` will throw.
    # We can just remove `const styles = makeStyles(theme);` from _layout.tsx manually later or fix it here.
    if 'makeStyles' not in content and 'const styles = makeStyles(theme);' in content:
        content = content.replace("  const styles = makeStyles(theme);", "")
        
    # fix missing imports
    if "import { useTheme }" not in content:
        content = "import { useTheme } from '@/lib/theme';\n" + content
        
    with open(full_path, 'w') as f:
        f.write(content)

for file_path in files:
    process_file(file_path)
