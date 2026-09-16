---
name: Custom Word Pack Submission
about: Submit a new language or category word pack for Imposter
title: '[WORDS] '
labels: ['word-pack']
assignees: ''
---

**Language & Theme**
- **Language**: [e.g. Spanish, German, Japanese, English]
- **Theme / Category**: [e.g. Pop Culture, Food & Drink, Sci-Fi, General]

**Word Pairs (JSON format)**
Please provide your word pairs in valid JSON:

```json
[
  {
    "civilian": "...",
    "imposter": "...",
    "category": "...",
    "hint": "..."
  }
]
```

**Quality Checklist**
- [ ] Word pairs are in the same general category.
- [ ] Words are related enough to keep clues ambiguous, but distinct enough to detect the imposter.
- [ ] Content is friendly for general party play.
- [ ] JSON is validated and formatted cleanly.
