# KitchenLedger — Final QA Kontrol Listesi

Manuel kontrol listesi — kurulum, rol bazlı erişim, operasyonel akışlar ve Türkçe UI doğrulaması.  
İlgili dokümanlar: [DEMO.md](DEMO.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [README](../README.md)

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
- [ ] **İşlem Kayıtları** (`/audit-logs`) menüde görünüyor
- [ ] Mutation sonrası audit log oluşuyor; detayda hassas alan yok
- [ ] **Kullanıcılar** (`/team`) menüde görünüyor
- [ ] Yeni kullanıcı oluşturma, rol ve şube atama çalışıyor
- [ ] Pasife alınan kullanıcı organizasyona erişemiyor
- [ ] Create / Edit / Pasife Al aksiyonları görünüyor
- [ ] Şube yönetimi (oluşturma/düzenleme) erişilebilir
- [ ] Her iki şube verisi (Main Kitchen + Kadikoy) görülebiliyor

### ADMIN (`admin@kitchenledger.app`)

- [ ] **İşlem Kayıtları** menüsü görünmüyor; `/audit-logs` erişim engeli
- [ ] **Kullanıcılar** menüsü görünüyor

### BRANCH_MANAGER (`manager@kitchenledger.app`)

- [ ] **İşlem Kayıtları** ve **Kullanıcılar** menüsü görünmüyor
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
- [ ] Siparişler sayfasında Yeni Sipariş, Düzenle ve durum güncelleme görünmüyor
- [ ] Stok sayfasında Stok Düzelt CTA görünmüyor
- [ ] Sadece Main Kitchen siparişi görünür (ORD-2026-0001); Kadikoy siparişi görünmez
- [ ] Mutation denemesi API tarafında engelleniyor (UI’da buton yok)

---

## D. Ana İş Akışı Kontrolü

Owner veya Admin ile giriş yapın:

1. [ ] **Malzeme oluştur** — `/ingredients`
2. [ ] **Tedarikçi oluştur** — `/suppliers`
3. [ ] **Satın alma oluştur** — `/purchases` (kalem ekle, kaydet)
4. [ ] **Satın alma iptal** — Tüketilmemiş kayıt iptal; stok düşer, hareket ve audit log oluşur
5. [ ] **Satın alma iptal engeli** — Tüketilmiş batch varsa iptal edilemez (409)
6. [ ] **Stok özetinde artış** — `/inventory` → Stok Özeti / Stok Partileri
7. [ ] **Stok düzeltme** — Fire/Zayi, İade veya Manuel Düzeltme; hareket geçmişinde görünmeli
8. [ ] **Yetersiz stok** — Fire/azaltma denemesinde Türkçe hata mesajı
9. [ ] **Sipariş oluştur** — `/orders` (müşteri + ürün kalemleri, toplam kontrol)
10. [ ] **Sipariş düzenle** — Müşteri/kalem/değişiklik; canlı toplam; kayıt sonrası liste/detay/rapor güncel
11. [ ] **Sipariş düzenleme engeli** — `DELIVERED` / `CANCELLED` siparişte Düzenle yok; API `400`
12. [ ] **Sipariş durumu güncelle** — Liste veya detaydan
13. [ ] **Ürün oluştur** — `/products`
14. [ ] **Reçete oluştur** — `/recipes`
15. [ ] **Reçete maliyetini görüntüle** — Maliyeti Gör + şube seç
16. [ ] **Üretim oluştur** — `/productions`
17. [ ] **FIFO tüketim** — Üretim detayında partiler ve maliyet kaydı
18. [ ] **Üretim iptal** — Aktif üretim iptal; stok geri gelir, reversal hareketleri ve audit log oluşur
19. [ ] **Üretim çift iptal engeli** — Aynı üretim tekrar iptal → `400`
20. [ ] **Üretim raporu** — İptal edilen kayıtlar listede; özet toplamlar yalnızca ACTIVE
21. [ ] **Panel ve Stok güncellendi** — `/dashboard` ve `/inventory` (iptal sonrası maliyet düşer)

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
| Viewer üretim iptal (API)                | `403`                                             |
| Üretim iptal sonrası stok                | Batch `remainingQuantity` geri gelir              |
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
