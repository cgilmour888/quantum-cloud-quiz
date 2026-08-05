# A2.3 Known Limitations

1. MASTER contains the original tablet and placeholder copy permanently. A2.3 fully occludes that footprint with original-pixel derivatives rather than destructively editing MASTER.
2. The background-restoration asset is intentionally transparent because the replacement shell completely covers the original tablet footprint. Reconstructing unseen background would introduce avoidable artifacts.
3. A2.3 v1.0.1 intentionally excludes reading overlays, hover expansion, answer expansion, and dashboard changes.
4. Rare typography outliers are reported rather than silently hidden. Their advanced reading behavior belongs to a later visually approved phase.
5. Final browser, font, touch, and Mac GPU behavior must be verified on the target Mac.
