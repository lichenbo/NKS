#!/usr/bin/env python3
import os
import re
from pathlib import Path
import sys

try:
    from deep_translator import GoogleTranslator
except Exception:
    print("ERROR: deep_translator is not installed. Activate venv and run: pip install deep-translator", file=sys.stderr)
    sys.exit(1)


FENCE_RE = re.compile(r"^\s*```")
INLINE_CODE_RE = re.compile(r"`([^`]+)`")
ANNO_TARGET_RE = re.compile(r"\(annotation:([^)]+)\)")
ANNO_BARE_RE = re.compile(r"(?<!\()annotation:([a-z0-9\-]+)")


def chunk_paragraphs(paragraphs, max_chars=800):
    chunks = []
    current = []
    current_len = 0
    for p in paragraphs:
        add_len = len(p) + 2
        if current and current_len + add_len > max_chars:
            chunks.append("\n\n".join(current))
            current = [p]
            current_len = len(p)
        else:
            current.append(p)
            current_len += add_len
    if current:
        chunks.append("\n\n".join(current))
    return chunks


def protect_inline_code(text):
    placeholders = {}
    def repl(m):
        key = f"__INLINE_CODE_{len(placeholders)}__"
        placeholders[key] = m.group(0)
        return key
    return INLINE_CODE_RE.sub(repl, text), placeholders


def protect_annotations(text):
    placeholders = {}

    def repl_target(m):
        key = f"__ANNO_T_{len(placeholders)}__"
        placeholders[key] = m.group(0)
        return key

    def repl_bare(m):
        key = f"__ANNO_B_{len(placeholders)}__"
        placeholders[key] = m.group(0)
        return key

    text = ANNO_TARGET_RE.sub(repl_target, text)
    text = ANNO_BARE_RE.sub(repl_bare, text)
    return text, placeholders


def restore_inline_code(text, placeholders):
    for k, v in placeholders.items():
        text = text.replace(k, v)
    return text


def slug_to_title(slug: str) -> str:
    return slug.replace('-', ' ').strip().title()


def normalize_annotations(md: str) -> str:
    def repl_bracketed(m):
        slug = m.group(1).strip()
        title = slug_to_title(slug)
        return f"[{title}](annotation:{slug})"

    md = re.sub(r"\[annotation:\s*([a-z0-9\-]+)\]", repl_bracketed, md)
    md = re.sub(r"\]\s+\(", "](", md)
    md = re.sub(r"\(annotation:\s*([a-z0-9\-]+)\)", r"(annotation:\1)", md)

    def repl_bare(m):
        slug = m.group(1)
        title = slug_to_title(slug)
        return f"[{title}](annotation:{slug})"
    md = re.sub(r"(?<!\()annotation:\s*([a-z0-9\-]+)", repl_bare, md)
    return md


def translate_markdown(content: str, translator: GoogleTranslator) -> str:
    lines = content.splitlines()
    segments = []
    buf = []
    in_code = False
    for line in lines:
        if FENCE_RE.match(line):
            if buf:
                segments.append((in_code, "\n".join(buf)))
                buf = []
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
            continue
        paras = seg.split("\n\n")
        protected = []
        ph_list = []
        for p in paras:
            # Protect inline code and annotation targets so translator won't touch them
            prot, ph_inline = protect_inline_code(p)
            prot, ph_ann = protect_annotations(prot)
            # merge placeholders maps (keys already namespaced)
            ph_inline.update(ph_ann)
            protected.append(prot)
            ph_list.append(ph_inline)
        tr_chunks = []
        for ch in chunk_paragraphs(protected):
            txt = ch.strip()
            if not txt:
                tr_chunks.append(txt)
                continue
            try:
                tr_chunks.append(translator.translate(txt))
            except Exception:
                tr_chunks.append(txt)
        tr_seg = "\n\n".join(tr_chunks)
        # restore placeholders per paragraph boundary
        restored = []
        tr_paras = tr_seg.split("\n\n") if tr_seg else []
        for i, tp in enumerate(tr_paras):
            if i < len(ph_list):
                tp = restore_inline_code(tp, ph_list[i])
            restored.append(tp)
        out.append("\n\n".join(restored))
    return "\n".join(out)


def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def translate_dir(src_dir: Path, dst_dir: Path, translator: GoogleTranslator):
    if not src_dir.exists():
        return
    ensure_dir(dst_dir)
    for src in sorted(src_dir.glob('*.md')):
        dst = dst_dir / src.name
        try:
            content = src.read_text(encoding='utf-8')
        except Exception as e:
            print(f"Skip read error: {src}: {e}", file=sys.stderr)
            continue
        print(f"JA: {src} -> {dst}")
        try:
            translated = translate_markdown(content, translator)
            translated = normalize_annotations(translated)
        except Exception as e:
            print(f"Translate failed, keeping original for {src}: {e}", file=sys.stderr)
            translated = content
        try:
            dst.write_text(translated, encoding='utf-8')
        except Exception as e:
            print(f"Write failed: {dst}: {e}", file=sys.stderr)


def main():
    translator = GoogleTranslator(source='auto', target='ja')

    # 1) Translate chapters/zh -> chapters/ja
    translate_dir(Path('chapters/zh'), Path('chapters/ja'), translator)

    # 2) Translate chapters/en files that don't exist in zh (e.g., interview.md)
    en_dir = Path('chapters/en')
    zh_dir = Path('chapters/zh')
    ja_dir = Path('chapters/ja')
    if en_dir.exists():
        ensure_dir(ja_dir)
        zh_names = {p.name for p in zh_dir.glob('*.md')} if zh_dir.exists() else set()
        for src in sorted(en_dir.glob('*.md')):
            if src.name in zh_names:
                continue  # prefer zh->ja for consistency
            dst = ja_dir / src.name
            try:
                content = src.read_text(encoding='utf-8')
            except Exception as e:
                print(f"Skip read error: {src}: {e}", file=sys.stderr)
                continue
            print(f"JA (from EN): {src} -> {dst}")
            try:
                translated = translate_markdown(content, translator)
                translated = normalize_annotations(translated)
            except Exception as e:
                print(f"Translate failed, keeping original for {src}: {e}", file=sys.stderr)
                translated = content
            try:
                dst.write_text(translated, encoding='utf-8')
            except Exception as e:
                print(f"Write failed: {dst}: {e}", file=sys.stderr)

    # 3) Translate annotations/zh -> annotations/ja
    translate_dir(Path('annotations/zh'), Path('annotations/ja'), translator)

    print('Done JA translations.')


if __name__ == '__main__':
    main()
