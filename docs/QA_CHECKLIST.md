# KitchenLedger — Final QA Kontrol Listesi

Portfolyo, demo ve GitHub sunumu öncesi manuel kontrol listesi.  
İlgili dokümanlar: [DEMO.md](DEMO.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [README](../README.md)

**Son tarayıcı/API QA (Adım 30):** 2026-06 — Owner/Viewer/Manager/Staff akışları; tüm dashboard route’ları HTTP 200; branch scope ve permission kontrolleri API ile doğrulandı.

**Reports QA (Adım 31):** `/reports` — 4 tab, filtreler, özet kartlar, CSV export (max 1000 kayıt), branch scope korunur; VIEWER export yapabilir.

**Team management QA (Adım 36):** `/team` — OWNER/ADMIN kullanıcı oluşturma, rol/şube atama, pasife alma; MANAGER/STAFF/VIEWER menü ve API erişimi yok.

---

## A. Kurulum Kontrolü

- [ ] `pnpm install`
- [ ] `cp apps/api/.env.example apps/api/.env`
- [ ] `cp apps/web/.env.example apps/web/.env.local`
- [ ] `apps/api/.env` içinde geçerli `DATABASE_URL` ayarlandı
- [ ] `pnpm db:generate`
- [ ] `pnpm db:migrate`
- [ ] `pnpm db:seed`
- [ ] `pnpm build`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`

**Çalıştırma:**

```bash
pnpm --filter @kitchenledger/api dev   # http://localhost:3001
pnpm --filter @kitchenledger/web dev    # http://localhost:3000
```

---

## B. Auth Kontrolü

Tüm demo kullanıcılar için şifre: **`Password123!`**

| Kullanıcı      | E-posta                     |
| -------------- | --------------------------- |
| Owner          | `owner@kitchenledger.app`   |
| Admin          | `admin@kitchenledger.app`   |
| Branch Manager | `manager@kitchenledger.app` |
| Staff          | `staff@kitchenledger.app`   |
| Viewer         | `viewer@kitchenledger.app`  |
| Legacy owner   | `demo@kitchenledger.app`    |

**Kontrol:**

- [ ] Login çalışıyor mu?
- [ ] Logout çalışıyor mu?
- [ ] Sayfa yenileme / refresh sonrası oturum korunuyor mu?
- [ ] Yetkisiz durumda (token yok) login sayfasına yönlendiriyor mu?
- [ ] Login formu 8 karakterden kısa şifreyi reddediyor mu?

---

## C. Rol Kontrolü

### OWNER / ADMIN

- [ ] Tüm sidebar sayfaları görünüyor
- [ ] **Kullanıcılar** (`/team`) menüde görünüyor
- [ ] Yeni kullanıcı oluşturma, rol ve şube atama çalışıyor
- [ ] Pasife alınan kullanıcı organizasyona erişemiyor
- [ ] Create / Edit / Pasife Al aksiyonları görünüyor
- [ ] Şube yönetimi (oluşturma/düzenleme) erişilebilir
- [ ] Her iki şube verisi (Main Kitchen + Kadikoy) görülebiliyor

### BRANCH_MANAGER (`manager@kitchenledger.app`)

- [ ] **Kullanıcılar** menüsü görünmüyor; `/team` URL → erişim engeli mesajı
- [ ] Şube yönetimi (Yeni Şube) görünmüyor
- [ ] Pasife Al aksiyonları görünmüyor
- [ ] Satın alma, sipariş ve üretim oluşturabiliyor
- [ ] Kadikoy şube kapsamındaki veriler görünüyor
- [ ] Main Kitchen satın alma/üretim/sipariş kayıtları branch filtreli listelerde görünmüyor
- [ ] Şube filtre/create select’lerinde sadece Kadikoy görünür

### STAFF (`staff@kitchenledger.app`)

- [ ] Satın alma, sipariş ve üretim oluşturabiliyor
- [ ] Malzeme/tedarikçi/ürün/reçete oluşturma/düzenleme erişilebilir
- [ ] Şube yönetimi görünmüyor
- [ ] Pasife Al aksiyonları görünmüyor
- [ ] Main Kitchen kapsamındaki veriler görünüyor
- [ ] Şube filtre/create select’lerinde sadece Main Kitchen görünür

### VIEWER (`viewer@kitchenledger.app`)

- [ ] Oluştur / Düzenle / Pasife Al butonları görünmüyor
- [ ] Panel, Stok, Ürünler, Reçeteler, Satın Almalar, Siparişler, Üretimler okunabilir
- [ ] Siparişler sayfasında Yeni Sipariş ve durum güncelleme görünmüyor
- [ ] Stok sayfasında Stok Düzelt CTA görünmüyor
- [ ] Sadece Main Kitchen siparişi görünür (ORD-2026-0001); Kadikoy siparişi görünmez
- [ ] Mutation denemesi API tarafında engelleniyor (UI’da buton yok)

---

## D. Ana İş Akışı Kontrolü

Owner veya Admin ile giriş yapın:

1. [ ] **Malzeme oluştur** — `/ingredients`
2. [ ] **Tedarikçi oluştur** — `/suppliers`
3. [ ] **Satın alma oluştur** — `/purchases` (kalem ekle, kaydet)
4. [ ] **Stok özetinde artış** — `/inventory` → Stok Özeti / Stok Partileri
5. [ ] **Stok düzeltme** — Fire/Zayi, İade veya Manuel Düzeltme; hareket geçmişinde görünmeli
6. [ ] **Yetersiz stok** — Fire/azaltma denemesinde Türkçe hata mesajı
7. [ ] **Sipariş oluştur** — `/orders` (müşteri + ürün kalemleri, toplam kontrol)
8. [ ] **Sipariş durumu güncelle** — Liste veya detaydan
9. [ ] **Ürün oluştur** — `/products`
10. [ ] **Reçete oluştur** — `/recipes`
11. [ ] **Reçete maliyetini görüntüle** — Maliyeti Gör + şube seç
12. [ ] **Üretim oluştur** — `/productions`
13. [ ] **FIFO tüketim** — Üretim detayında partiler ve maliyet kaydı
14. [ ] **Panel ve Stok güncellendi** — `/dashboard` ve `/inventory`

---

## E. Türkçe UI Kontrolü

- [ ] Sidebar linkleri Türkçe (Panel, Şubeler, Malzemeler…)
- [ ] Header (Çıkış Yap, İşletme seçimi)
- [ ] Auth ekranları (Giriş Yap, Kayıt Ol)
- [ ] Form etiketleri ve placeholder’lar
- [ ] Dialog başlıkları (Oluştur / Düzenle / Detay)
- [ ] Empty state metinleri
- [ ] Validation mesajları (Zod, Türkçe)
- [ ] API hata mesajları (Türkçe veya çevrilmiş)
- [ ] Tablo sütun başlıkları
- [ ] Panel kartları ve grafik açıklamaları
- [ ] Maliyet dökümü (cost breakdown)
- [ ] Üretim detayı (FIFO tüketim, maliyet kaydı)

---

## F. Bilinen Manuel Senaryolar

| Senaryo                                  | Beklenen                                          |
| ---------------------------------------- | ------------------------------------------------- |
| Üretimde yetersiz stok                   | Türkçe hata: malzeme adı, gerekli/mevcut miktar   |
| Aynı malzeme iki kez (satın alma/reçete) | “Aynı malzeme birden fazla kez eklenemez.”        |
| Duplicate SKU (ürün/malzeme)             | API conflict mesajı (Türkçe çeviri)               |
| Birim uyuşmazlığı (unit mismatch)        | Türkçe birim hatası                               |
| Viewer mutation butonları                | Görünmemeli                                       |
| Branch-scoped stok                       | Manager/staff sadece yetkili şube stokunu görmeli |

---

## Hızlı Demo Akışı (5 dk)

```text
owner@kitchenledger.app / Password123!
→ Satın Alma oluştur
→ Stok kontrol
→ Reçete maliyeti
→ Üretim oluştur
→ FIFO detay
→ Panel özeti
```

```text
viewer@kitchenledger.app / Password123!
→ Read-only UI doğrula
```

```text
manager@kitchenledger.app / Password123!
→ Kadikoy branch scope doğrula
```

---

## Notlar

- `pnpm db:seed` demo organizasyonunu sıfırlar; production’da otomatik çalıştırmayın.
- Debug endpoint’ler (`/debug/*`) yalnızca `NODE_ENV !== production` iken aktiftir.
- Ekran görüntüleri: `assets/screenshots/` (henüz pending — README’de liste).
