#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

try:
    from deep_translator import GoogleTranslator
except Exception as e:
    print("ERROR: deep_translator is not installed. Install with: pip install deep-translator", file=sys.stderr)
    sys.exit(1)


SRC_DIR = Path('chapters/zh')
DST_DIR = Path('chapters/en')


def chunk_paragraphs(paragraphs, max_chars=800):
    chunks = []
    current = []
    current_len = 0
    for p in paragraphs:
        # Ensure trailing newline between paragraphs when joining
        add_len = len(p) + 2
        if current_len + add_len > max_chars and current:
            chunks.append("\n\n".join(current))
            current = [p]
            current_len = len(p)
        else:
            current.append(p)
            current_len += add_len
    if current:
        chunks.append("\n\n".join(current))
    return chunks


FENCE_RE = re.compile(r"^\s*```")
INLINE_CODE_RE = re.compile(r"`([^`]+)`")


def protect_inline_code(text):
    placeholders = {}
    def repl(m):
        key = f"__INLINE_CODE_{len(placeholders)}__"
        placeholders[key] = m.group(0)
        return key
    protected = INLINE_CODE_RE.sub(repl, text)
    return protected, placeholders


def restore_inline_code(text, placeholders):
    for key, value in placeholders.items():
        text = text.replace(key, value)
    return text


def translate_markdown(content: str, translator: GoogleTranslator) -> str:
    # Split content into segments: code-fenced blocks vs normal text
    lines = content.splitlines()
    segments = []  # (is_code, text)
    buf = []
    in_code = False
    for line in lines:
        if FENCE_RE.match(line):
            # flush buffer
            if buf:
                segments.append((in_code, "\n".join(buf)))
                buf = []
            # toggle code state and include the fence line in its own segment to preserve
            in_code = not in_code
            segments.append((True, line))
        else:
            buf.append(line)
    if buf:
        segments.append((in_code, "\n".join(buf)))

    out = []
    for is_code, seg in segments:
        if is_code:
            out.append(seg)
        else:
            # Translate this non-code segment paragraph-by-paragraph
            paragraphs = [p for p in seg.split("\n\n")]
            # Protect inline code to avoid mangling identifiers
            protected_paragraphs = []
            placeholders_list = []
            for p in paragraphs:
                prot, placeholders = protect_inline_code(p)
                protected_paragraphs.append(prot)
                placeholders_list.append(placeholders)

            chunks = chunk_paragraphs(protected_paragraphs)
            translated_chunks = []
            for ch in chunks:
                text = ch.strip()
                if not text:
                    translated_chunks.append(text)
                    continue
                try:
                    translated = translator.translate(text)
                except Exception as e:
                    # Fallback: return original chunk if translation fails
                    translated = text
                translated_chunks.append(translated)
            translated_seg = "\n\n".join(translated_chunks)

            # Restore inline code placeholders paragraph-by-paragraph
            # Split again to match paragraph boundaries
            restored = []
            tr_paras = translated_seg.split("\n\n") if translated_seg else []
            for idx, tr_p in enumerate(tr_paras):
                if idx < len(placeholders_list):
                    tr_p = restore_inline_code(tr_p, placeholders_list[idx])
                restored.append(tr_p)
            out.append("\n\n".join(restored))

    return "\n".join(out)


def slug_to_title(slug: str) -> str:
    # Convert slugs like 'computational-equivalence' to 'Computational Equivalence'
    return slug.replace('-', ' ').strip().title()


def normalize_annotations(md: str) -> str:
    # Fix patterns like: [annotation: slug] -> [Title](annotation:slug)
    def repl_bracketed(m):
        slug = m.group(1).strip()
        title = slug_to_title(slug)
        return f"[{title}](annotation:{slug})"

    md = re.sub(r"\[annotation:\s*([a-z0-9\-]+)\]", repl_bracketed, md)

    # Remove stray spaces between link text and target: "] (" -> "]("
    md = re.sub(r"\]\s+\(", "](", md)

    # Normalize spaces inside annotation links: (annotation: slug) -> (annotation:slug)
    md = re.sub(r"\(annotation:\s*([a-z0-9\-]+)\)", r"(annotation:\1)", md)

    # Convert stray 'annotation:slug' mentions into links when not already in '(annotation:slug)'
    def repl_bare_annotation(m):
        slug = m.group(1)
        title = slug_to_title(slug)
        return f"[{title}](annotation:{slug})"
    md = re.sub(r"(?<!\()annotation:\s*([a-z0-9\-]+)", repl_bare_annotation, md)

    return md


def main():
    if not SRC_DIR.exists():
        print(f"Source directory not found: {SRC_DIR}", file=sys.stderr)
        sys.exit(1)
    DST_DIR.mkdir(parents=True, exist_ok=True)

    translator = GoogleTranslator(source='auto', target='en')
    md_files = sorted([p for p in SRC_DIR.glob('*.md')])
    if not md_files:
        print("No markdown files found in chapters/zh")
        return

    for src in md_files:
        dst = DST_DIR / src.name
        try:
            content = src.read_text(encoding='utf-8')
        except Exception as e:
            print(f"Skipping {src}: read error: {e}", file=sys.stderr)
            continue

        print(f"Translating {src} -> {dst}")
        try:
            translated = translate_markdown(content, translator)
        except Exception as e:
            print(f"Translation pipeline failed for {src}: {e}", file=sys.stderr)
            translated = content

        try:
            normalized = normalize_annotations(translated)
            dst.write_text(normalized, encoding='utf-8')
        except Exception as e:
            print(f"Write failed for {dst}: {e}", file=sys.stderr)

    print("Done.")


if __name__ == '__main__':
    main()
