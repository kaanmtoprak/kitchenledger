# Screenshot Alma Rehberi

KitchenLedger ekran görüntüleri, canlı deploy olmadan local demo ortamından alınır. Görseller `assets/screenshots/` altına kaydedilir ve README’de yalnızca dosya mevcut olduğunda gösterilir.

## Hazırlık

```bash
pnpm db:seed
pnpm --filter @kitchenledger/api dev
pnpm --filter @kitchenledger/web dev
```

**Giriş:** [owner@kitchenledger.app](mailto:owner@kitchenledger.app) / `Password123!`

**Tarayıcı önerisi:**

- Chrome
- Zoom: 100%
- Desktop genişliği: 1440px veya 1536px
- Sidebar açık
- **Demo Bakery** organizasyonu seçili

**İpucu:** macOS’ta tam pencere yakalamak için `Cmd + Shift + 4` → `Space` ile pencere seçimi veya tarayıcı geliştirici araçlarından responsive modu kullanın.

---

## Alınacak ekranlar

### 1. Dashboard

- **Route:** `/dashboard`
- **Dosya:** `assets/screenshots/01-dashboard.png`
- **Not:** Özet kartlar, üretim trendi ve kritik stok görünmeli.

### 2. Inventory

- **Route:** `/inventory`
- **Dosya:** `assets/screenshots/02-inventory.png`
- **Not:** Stok özeti sekmesi açık olsun.

### 3. Purchases

- **Route:** `/purchases`
- **Dosya:** `assets/screenshots/03-purchases.png`
- **Not:** Satın alma listesi ve durum badge’leri görünmeli.

### 4. Recipe Cost

- **Route:** `/recipes`
- **Aksiyon:** Bir reçete için **Maliyeti Gör**
- **Dosya:** `assets/screenshots/04-recipes-cost.png`
- **Not:** Toplam maliyet, verim başına maliyet ve porsiyon maliyeti görünmeli.

### 5. Productions

- **Route:** `/productions`
- **Dosya:** `assets/screenshots/05-productions.png`
- **Not:** Üretim listesi veya üretim detay / FIFO tüketim dialogu tercih edilebilir.

### 6. Orders

- **Route:** `/orders`
- **Dosya:** `assets/screenshots/06-orders.png`
- **Not:** Sipariş listesi, durum badge ve toplam tutar görünmeli.

### 7. Reports

- **Route:** `/reports`
- **Dosya:** `assets/screenshots/07-reports.png`
- **Not:** Bir rapor sekmesi, özet kartlar ve CSV dışa aktarma butonu görünmeli.

### 8. Stock Adjustment

- **Route:** `/inventory`
- **Aksiyon:** **Stok Düzelt**
- **Dosya:** `assets/screenshots/08-stock-adjustment.png`
- **Not:** Stok düzeltme dialogu açık olsun.

### 9. Team Management

- **Route:** `/team`
- **Dosya:** `assets/screenshots/09-team-management.png`
- **Not:** Kullanıcılar, roller ve şube erişimleri görünmeli.

### 10. Audit Logs

- **Route:** `/audit-logs`
- **Dosya:** `assets/screenshots/10-audit-logs.png`
- **Not:** İşlem kayıtları ve işlem türleri görünmeli.

---

## README’ye ekleme

Görsel dosyaları `assets/screenshots/` altına kaydettikten sonra `README.md` içindeki **Screenshots** bölümündeki pending listesini ilgili `![...](assets/screenshots/....png)` satırlarıyla değiştirin. Dosya yokken image linki eklemeyin — broken image oluşur.

Beklenen dosya adları:

| Dosya | Ekran |
| ----- | ----- |
| `01-dashboard.png` | Dashboard |
| `02-inventory.png` | Inventory |
| `03-purchases.png` | Purchases |
| `04-recipes-cost.png` | Recipe costing |
| `05-productions.png` | Productions |
| `06-orders.png` | Orders |
| `07-reports.png` | Reports |
| `08-stock-adjustment.png` | Stock adjustment |
| `09-team-management.png` | Team management |
| `10-audit-logs.png` | Audit logs |
