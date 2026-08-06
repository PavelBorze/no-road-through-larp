# No Road Through — LARP

אתר תדמית סטטי למשחק תפקידים חי. פנטזיה היסטורית מאופקת, עברית, פריסת RTL.

## העלאה ל־GitHub Pages

1. העלו את כל הקבצים למאגר חדש ב־GitHub.
2. תחת **Settings → Pages**, בחרו **Deploy from a branch**.
3. בחרו את הבראנץ' הראשי ואת תיקיית השורש (`/root`).
4. האתר יעלה לכתובת `https://<user>.github.io/<repo>/`.

## מבנה הקבצים

```
index.html      — הדף הבודד, סמנטי, RTL
styles.css      — מערכת העיצוב (אסימונים, פריסות, רספונסיביות)
main.js         — אנימציות חשיפה, ספירה לאחור, תפריט, חשיפת מיקום
assets/sigil.svg — סמל האתר (favicon)
docs/           — מסמכי PDF להורדה (יש להניח כאן את הקבצים האמיתיים)
```

## הוספת מסמכים אמיתיים

הניחו את קבצי ה־PDF בתיקיית `docs/` עם שמות הקבצים המופיעים באתר:

- `eldhar-rulebook.pdf`
- `eldhar-character-guide.pdf`
- `eldhar-map.pdf`
- `eldhar-registration.pdf`

אין צורך בבנייה או בתלויות — הקבצים מוכנים לאחסון סטטי.
