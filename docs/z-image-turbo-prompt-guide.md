# Complete Prompting Manual

## Z-Image / Z-Image Turbo

This manual consolidates, recompiles, and standardizes all best practices for prompting Z-Image and Z-Image Turbo, written in clean Markdown format and integrating official guides, technical articles, and practical examples.

---

## 1. Z-Image Turbo Overview

Z-Image Turbo is an image generation model based on diffusion with a Single-Stream Diffusion Transformer (S3-DiT) architecture. Text and image are processed in a single unified stream, making the prompt the primary and most critical control mechanism.

Key characteristics:

* High obedience to textual instructions
* Very few diffusion steps (approximately 8)
* Positive prompt as the central control mechanism
* Negative prompt is not part of the official pipeline

Practical conclusion:
Everything that should appear or should not appear in the image must be explicitly described in the positive prompt.

---

## 2. Prompting Philosophy

### 2.1 Long Positive Prompts

Z-Image responds best to narrative, descriptive, and complete prompts.

Best practices:

* Use full sentences in natural language
* Ideal length between 80 and 250 words
* Avoid loose keyword or tag lists

### 2.2 Explicit Control

The model does not infer hidden intent.
If something is not explicitly stated, it may appear in the image.

---

## 3. The Universal 6-Part Prompt Formula

All reference materials converge on the same logical six-block structure.

### 3.1 Subject

Defines who or what appears in the image.

Include:

* Age
* Physical appearance
* Expression
* Action or posture

### 3.2 Scene

Defines the context.

Include:

* Location
* Everyday, editorial, or artistic context
* Overall atmosphere

### 3.3 Composition

Defines framing and camera behavior.

Include:

* Shot type
* Camera angle
* Gaze direction
* Posed or candid behavior

### 3.4 Lighting

Defines lighting conditions.

Include:

* Light type
* Direction
* Softness or hardness

### 3.5 Style

Defines visual direction.

Include:

* Photorealistic, editorial, illustrative, etc.
* Lens style
* Color palette

### 3.6 Constraints

Defines strict rules and exclusions.

Examples:

* Safe for work
* No logos
* No text
* No watermark
* Correct anatomy

---

## 4. Minor-Safe Prompting

Mandatory rules when minors are involved:

* Explicitly declare age
* Use terms such as minor or teenage
* Clothing must be fully clothed and modest
* Public or everyday environments only

Recommended constraints:

* Non-sexual
* Non-suggestive
* No sexualization of minors

---

## 5. Natural and Candid Imagery

To avoid artificial or posed portraits:

* Use terms such as candid, unposed, documentary style
* Explicitly state not looking at the camera
* Introduce light action (walking, observing surroundings)

---

## 6. JSON as an Abstraction Layer

Z-Image does not interpret JSON natively.

Recommended pipeline:

1. Structured JSON
2. Automatic conversion to narrative text
3. Final prompt sent to the model

Benefits:

* Standardization
* Automation
* Prompt builders

---

## 7. Commented Examples (6 Blocks)

### 7.1 Example – Natural Portrait (Adult)

```text
Subject:
Adult woman in her early 30s, natural facial features, relaxed expression, realistic skin texture, fully clothed in modest casual clothing.

Scene:
Outdoor urban environment on a quiet street, everyday context.

Composition:
Candid medium shot, subject not looking at the camera, natural posture.

Lighting:
Soft natural daylight, evenly diffused.

Style:
Photorealistic documentary photography.

Constraints:
Safe for work, no logos, no text, no watermark, correct anatomy.
```

Commentary: Narrative syntax and explicit constraints reduce artifacts and artificial posing.

---

### 7.2 Example – Minor-Safe Portrait

```text
Subject:
16-year-old teenage girl, clearly identified as a minor, fully clothed in modest casual clothing.

Scene:
Public park during daytime, wholesome everyday environment.

Composition:
Candid medium shot, not looking at the camera, relaxed body language.

Lighting:
Soft natural daylight.

Style:
Photorealistic lifestyle photography.

Constraints:
Safe for work, non-sexual, non-suggestive, no sexualization of minors, no logos, no text, no watermark.
```

---

## 8. Wrong vs. Correct Examples

### 8.1 Short and Vague Prompt

❌ Wrong:
"A girl in a park, realistic photo."

✅ Correct:
(See Example 7.2)

---

### 8.2 Reliance on Negative Prompt

❌ Wrong:
"Portrait of a woman" with negative prompt.

✅ Correct:
Explicit constraints embedded in the positive prompt.

---

## 9. Prompt Debugging Guide

### 9.1 Subject Always Looking at the Camera

Fix:

* Add not looking at the camera, candid, unposed.

### 9.2 Artificial or Plastic Appearance

Fix:

* Specify soft natural lighting and documentary or lifestyle style.

### 9.3 Unwanted Logos or Text

Fix:

* Explicitly include no logos, no text, no watermark.

---

## 10. Final Checklist

* Age explicitly declared
* Clothing clearly defined
* Action or posture described
* Lighting specified
* Style defined
* Constraints explicitly stated

---

## 11. Conclusion

Z-Image Turbo rewards clarity, structure, and explicit intent.

Whoever controls the text, controls the image.

This document should be treated as a permanent reference for any workflow involving Z-Image or Z-Image Turbo.
