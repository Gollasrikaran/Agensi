import uuid

def encode_watermark(buyer_id: str) -> str:
    # Remove hyphens
    clean_id = buyer_id.replace('-', '')
    
    # We can encode hex digits to invisible chars directly or use binary
    # Hex has 16 characters. We can map each hex char (0-f) to a 4-bit binary sequence.
    # 0 = \u200B (Zero-width space)
    # 1 = \u200C (Zero-width non-joiner)
    binary_str = bin(int(clean_id, 16))[2:].zfill(128)
    
    mapping = {'0': '\u200B', '1': '\u200C'}
    invisible_str = '\u200D' + ''.join(mapping[b] for b in binary_str) + '\u200D'
    return invisible_str

def decode_watermark(text: str) -> str:
    # Find the bounds of \u200D
    start = text.find('\u200D')
    if start == -1: return None
    end = text.find('\u200D', start + 1)
    if end == -1: return None
    
    invisible_str = text[start+1:end]
    
    rev_mapping = {'\u200B': '0', '\u200C': '1'}
    binary_str = ''.join(rev_mapping[c] for c in invisible_str)
    
    # Convert binary back to hex and then UUID format
    hex_str = hex(int(binary_str, 2))[2:].zfill(32)
    return str(uuid.UUID(hex_str))

# Test
uid = str(uuid.uuid4())
wm = encode_watermark(uid)
text = f"This is some markdown text.\n\n{wm}\n\n# More text"
print(f"Original: {uid}")
print(f"Extracted: {decode_watermark(text)}")
