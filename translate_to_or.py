import os
import glob
import toml
from deep_translator import GoogleTranslator

translator = GoogleTranslator(source='en', target='or')

def translate_text(text):
    if not text or not isinstance(text, str):
        return text
    # Avoid translating short technical tokens or URLs intuitively if possible, but for now we translate all
    try:
        if len(text) > 4999:
            # Chunk it if necessary, but most of our fields are small
            return text
        return translator.translate(text)
    except Exception as e:
        print(f"Error translating: {text[:30]}... - {e}")
        return text

def translate_toml_file(filepath):
    print(f"Translating TOML: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = toml.load(f)
    
    # Common keys to translate in our TOMLs
    keys_to_translate = ['title', 'subtitle', 'top_title', 'description', 'details', 'name', 'about', 'summary']
    
    def traverse_translate(d):
        if isinstance(d, dict):
            for k, v in d.items():
                if k in keys_to_translate and isinstance(v, str):
                    d[k] = translate_text(v)
                elif isinstance(v, (dict, list)):
                    traverse_translate(v)
        elif isinstance(d, list):
            for i in range(len(d)):
                if isinstance(d[i], (dict, list)):
                    traverse_translate(d[i])
                elif isinstance(d[i], str):
                    # We might not want to translate all strings in a list (e.g. image paths)
                    pass
                    
    traverse_translate(data)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        toml.dump(data, f)

def translate_md_file(filepath):
    print(f"Translating MD: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Zola markdown files have +++ block for TOML frontmatter
    if content.startswith('+++'):
        parts = content.split('+++', 2)
        if len(parts) >= 3:
            frontmatter_str = parts[1]
            body_str = parts[2]
            
            try:
                fm_data = toml.loads(frontmatter_str)
                for key in ['title', 'description']:
                    if key in fm_data and isinstance(fm_data[key], str):
                        fm_data[key] = translate_text(fm_data[key])
                new_frontmatter = toml.dumps(fm_data)
            except Exception as e:
                print(f"Error parsing frontmatter in {filepath}: {e}")
                new_frontmatter = frontmatter_str
                
            # Translate body paragraphs
            paragraphs = body_str.split('\n\n')
            new_paragraphs = []
            for p in paragraphs:
                if p.strip() and not p.strip().startswith('{{') and not p.strip().startswith('{%') and not p.strip().startswith('!['):
                    new_paragraphs.append(translate_text(p))
                else:
                    new_paragraphs.append(p)
            new_body = '\n\n'.join(new_paragraphs)
            
            new_content = f"+++\n{new_frontmatter}+++\n{new_body}"
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

if __name__ == "__main__":
    toml_files = glob.glob('static/sections/**/or.toml', recursive=True)
    for f in toml_files:
        translate_toml_file(f)
        
    md_files = glob.glob('content/**/*.or.md', recursive=True)
    for f in md_files:
        translate_md_file(f)
