# Housing Conditions Page — Hub Layout Guide

Replace `BASEURL` with: `https://lbhousing.github.io/ArcGIS-Hub`

All Hub section backgrounds: `#0a0e1a`

---

## Row-by-Row Assembly

### ROW 1 — Hero (GitHub iframe)
```
URL:    BASEURL/conditions/hero.html
Height: 650
```

---

### ROW 2 — Marquee (GitHub iframe)
```
URL:    BASEURL/conditions/marquee.html
Height: 50
```

---

### ROW 3 — Section header "The Through-Line" (Hub text card)
```html
<div style="padding:40px 0 10px;">
  <div style="font-family:'Segoe UI',system-ui,sans-serif;font-size:80px;font-weight:300;color:#252d4a;line-height:1;">01</div>
  <span style="display:inline-block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;padding:5px 14px;border-radius:6px;background:rgba(210,51,63,.1);color:#D2333F;border:1px solid rgba(210,51,63,.2);margin-bottom:12px;">The Through-Line</span>
  <h2 style="font-family:'Segoe UI',system-ui,sans-serif;font-size:36px;font-weight:700;color:#f1f5f9;margin:0 0 6px;">A century of patterns. Still visible in the data.</h2>
  <p style="font-family:'Segoe UI',system-ui,sans-serif;font-size:16px;color:#94a3b8;margin:0;font-weight:300;">Housing conditions in Long Beach follow a geography of disinvestment that traces back to the 1930s.</p>
</div>
```

---

### ROW 4 — Timeline with redlining map (GitHub iframe)
```
URL:    BASEURL/conditions/timeline.html
Height: 1300
```
This is a tall block — it includes the interactive HOLC redlining map (500px) + the full timeline with bullet points + callout. On mobile you may need scrolling="auto".

---

### ROW 5 — Divider (Hub text card)
```html
<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);"></div>
```

---

### ROW 6 — Section header "Code Violations" (Hub text card)
```html
<div style="padding:40px 0 10px;">
  <div style="font-family:'Segoe UI',system-ui,sans-serif;font-size:80px;font-weight:300;color:#252d4a;line-height:1;">02</div>
  <span style="display:inline-block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;padding:5px 14px;border-radius:6px;background:rgba(247,186,33,.1);color:#F7BA21;border:1px solid rgba(247,186,33,.2);margin-bottom:12px;">Code Violations</span>
  <h2 style="font-family:'Segoe UI',system-ui,sans-serif;font-size:36px;font-weight:700;color:#f1f5f9;margin:0 0 6px;">Everyone deserves a safe, clean home.</h2>
  <p style="font-family:'Segoe UI',system-ui,sans-serif;font-size:16px;color:#94a3b8;margin:0;font-weight:300;">Housing violations are dangerous conditions that put renters' health and safety at risk. Explore where they concentrate.</p>
</div>
```

---

### ROW 7 — Violations Dashboard (Hub iframe card — AGOL app)
```
URL:    YOUR AGOL VIOLATIONS DASHBOARD URL
Height: 650
```
Use Hub's native **iframe card** or **Application card** pointing to your ArcGIS Dashboard.

---

### ROW 8 — Violations narrative (GitHub iframe)
```
URL:    BASEURL/conditions/narr-violations.html
Height: 320
```

---

### ROW 9 — Divider (Hub text card)
Same as Row 5.

---

### ROW 10 — Section header "Eviction Patterns" (Hub text card)
```html
<div style="padding:40px 0 10px;">
  <div style="font-family:'Segoe UI',system-ui,sans-serif;font-size:80px;font-weight:300;color:#252d4a;line-height:1;">03</div>
  <span style="display:inline-block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;padding:5px 14px;border-radius:6px;background:rgba(210,51,63,.1);color:#D2333F;border:1px solid rgba(210,51,63,.2);margin-bottom:12px;">Eviction Patterns</span>
  <h2 style="font-family:'Segoe UI',system-ui,sans-serif;font-size:36px;font-weight:700;color:#f1f5f9;margin:0 0 6px;">Where evictions concentrate. The displacement map.</h2>
  <p style="font-family:'Segoe UI',system-ui,sans-serif;font-size:16px;color:#94a3b8;margin:0;font-weight:300;">Eviction filings cluster in the same communities facing the worst housing conditions.</p>
</div>
```

---

### ROW 11 — Eviction Heat Map (Hub iframe card — AGOL app)
```
URL:    YOUR AGOL EVICTION DASHBOARD / HEAT MAP URL
Height: 650
```

---

### ROW 12 — Eviction narrative (GitHub iframe)
```
URL:    BASEURL/conditions/narr-evictions.html
Height: 320
```

---

### ROW 13 — Divider (Hub text card)
Same as Row 5.

---

### ROW 14 — Section header "Community Demographics" (Hub text card)
```html
<div style="padding:40px 0 10px;">
  <div style="font-family:'Segoe UI',system-ui,sans-serif;font-size:80px;font-weight:300;color:#252d4a;line-height:1;">04</div>
  <span style="display:inline-block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;padding:5px 14px;border-radius:6px;background:rgba(123,78,175,.1);color:#7B4EAF;border:1px solid rgba(123,78,175,.2);margin-bottom:12px;">Community Demographics</span>
  <h2 style="font-family:'Segoe UI',system-ui,sans-serif;font-size:36px;font-weight:700;color:#f1f5f9;margin:0 0 6px;">Who lives in the most impacted neighborhoods?</h2>
  <p style="font-family:'Segoe UI',system-ui,sans-serif;font-size:16px;color:#94a3b8;margin:0;font-weight:300;">Housing challenges intersect directly with race, ethnicity, and income.</p>
</div>
```

---

### ROW 15 — Ethnicity/Housing Map (Hub iframe card — AGOL app)
```
URL:    YOUR AGOL HOUSING MAPS / ETHNICITY MAP URL
Height: 650
```

---

### ROW 16 — Demographics narrative (GitHub iframe)
```
URL:    BASEURL/conditions/narr-demographics.html
Height: 320
```

---

### ROW 17 — Divider (Hub text card)
Same as Row 5.

---

### ROW 18 — Section header "Take Action" (Hub text card)
```html
<div style="padding:40px 0 10px;">
  <div style="font-family:'Segoe UI',system-ui,sans-serif;font-size:80px;font-weight:300;color:#252d4a;line-height:1;">05</div>
  <span style="display:inline-block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;padding:5px 14px;border-radius:6px;background:rgba(52,211,153,.08);color:#34d399;border:1px solid rgba(52,211,153,.2);margin-bottom:12px;">Take Action</span>
  <h2 style="font-family:'Segoe UI',system-ui,sans-serif;font-size:36px;font-weight:700;color:#f1f5f9;margin:0 0 6px;">What you can do right now.</h2>
</div>
```

---

### ROW 19 — Action cards (GitHub iframe)
```
URL:    BASEURL/conditions/action-cards.html
Height: 380
```
Mobile: Cards stack to 1 column — may need `height="700"` on narrow screens.

---

## Quick Reference

| Row | Type | Content | Height |
|-----|------|---------|--------|
| 1 | iframe (GitHub) | Hero | 650 |
| 2 | iframe (GitHub) | Marquee | 50 |
| 3 | text card | "01 The Through-Line" | — |
| 4 | iframe (GitHub) | Timeline + redlining map | 1300 |
| 5 | text card | Divider | — |
| 6 | text card | "02 Code Violations" | — |
| 7 | iframe (AGOL) | Violations Dashboard | 650 |
| 8 | iframe (GitHub) | Violations narrative | 320 |
| 9 | text card | Divider | — |
| 10 | text card | "03 Eviction Patterns" | — |
| 11 | iframe (AGOL) | Eviction Heat Map | 650 |
| 12 | iframe (GitHub) | Eviction narrative | 320 |
| 13 | text card | Divider | — |
| 14 | text card | "04 Demographics" | — |
| 15 | iframe (AGOL) | Ethnicity/Housing Map | 650 |
| 16 | iframe (GitHub) | Demographics narrative | 320 |
| 17 | text card | Divider | — |
| 18 | text card | "05 Take Action" | — |
| 19 | iframe (GitHub) | Action cards (4) | 380 |

**Total: 7 GitHub iframes + 3 AGOL iframes + 9 Hub text cards**

---

## GitHub Push Command

```bash
git add conditions/
git commit -m "Housing Conditions page: hero, marquee, timeline, narratives, action cards"
git push origin main
```

---

## AGOL Dashboard URLs — Fill These In

You need 3 AGOL app URLs for Rows 7, 11, and 15:

1. **Violations Dashboard:** `https://www.arcgis.com/apps/dashboards/________`
2. **Eviction Heat Map:** `https://www.arcgis.com/apps/dashboards/________`
3. **Housing/Ethnicity Map:** `https://www.arcgis.com/apps/mapviewer/________`

Find these in your AGOL Content → open each app → Share → Embed → copy the URL.
