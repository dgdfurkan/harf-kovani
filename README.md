# Harf Kovanı

Harflerden kelime çıkar, arı kolonini büyüt. Tarayıcıda oynanır; telefonda ana ekrana eklenince uygulama gibi açılır ve internetsiz çalışır.

**Oyna:** https://dgdfurkan.github.io/harf-kovani/

## Oyun

- **Harf Çiçeği** (100 bölüm): çiçekteki harflerden bölümün bütün kelimelerini bul. Kelimeler üstte boş petek gözleri olarak bekler. Ortadaki arıya dokunmak harfleri karıştırır.
- **Petek Avı** (60 bölüm): 19 gözlü kovanda komşu harfleri birleştir. Bulduğun harflerin yerine yenileri dolar, yeni kelimeler çıkacak şekilde seçilir.
- **Çengel Bulmaca** (100 bölüm): harf çarkından kelime yaz, kelimeler birbirini kesen bulmacaya yerleşsin. Bulmacada olmayan doğru kelimeler ekstra sayılır. Her on bölüm Türkiye'den bir durak: lavanta tarlaları, Kapadokya, Pamukkale, Karadeniz yaylası, Ege, Uludağ, Nemrut, Boğaz, Rize, Van.
- **Sonsuz Petek:** nektar çubuğu durmadan akar, her kelime doldurur. Her 8 kelimede yeni dalga gelir; puan çarpanı büyür, nektar hızlanır. Altın gözden geçen kelime iki kat puan alır. Nektar bitene kadar rekor kovala.
- Her onuncu bölüm zor bölümdür.
- **Kavanoz:** bulduğun her kelime kavanoza bal katar. İpucu (kelimenin anlamı) ve Arı Yardımı (bir harf ya da kelimenin yolu) kavanozdan yer, ikisi arasında 30 saniye beklenir.
- **Koloni:** her bölüm kovanın takviminde 6 gün ilerler. Mevsimler, hava, arı sayısı ve petek bölümlerle birlikte değişir. Her on bölümde bir hikaye kartı açılır.
- **Bahçe:** kesedeki balla kovanın çevresine çiçek, ağaç ve süs ekle. Her bitkinin ekim ve açma ayları var; takvimle büyür, mevsiminde açar. Açan çiçekler bala bereket katar, arılar onlara uçar.
- **Canlı sahne:** arılar kovandan çıkıp açık çiçeklerde nektar emer ve geri döner. Kelebekler, kuşlar, yaz gecesi ateş böcekleri, yağmur, kar, sonbahar yaprakları. Gökyüzü günün gerçek saatine göre şafak, gündüz, akşam ve gece olur. Kovana ve çiçeklere dokunulabilir.
- **Kelime kartları:** bulunan her kelimeye dokununca anlamı ve günlük kullanım örneği açılır. Hepsi Kelime Defteri'nde birikir.
- **Sıralama:** toplam bala göre, dreamlo.com üzerinden (`js/config.js`).
- Dört tema, mevsime göre değişen müzik, kayıt kodu ile cihazlar arası taşıma.

## Geliştirme

Derleme adımı yok. Yerelde herhangi bir statik sunucu yeter:

```
python3 -m http.server 5181
```

- `python3 tools/build.py` sw.js dosyasını (çevrimdışı önbellek listesi ve sürüm) üretir, CSS'teki px değerlerini rem'e çevirir. Her değişiklikten sonra çalıştır.
- `python3 tools/cengel-gen.py` Çengel Bulmaca'nın ızgaralarını üretir (yalnız anlamı yazılmış kelimelerle).
- `python3 tools/kovan-gen.py` kelime verilerini üretir: `tools/kovan-sozluk.txt` (elle seçilmiş sözlük) ve `tools/anlamlar.txt` (kelime kartları) kaynaktır. Yeni bölüm ya da kelime eklemek için bu iki dosyayı düzenleyip betiği çalıştır.
- Yayın GitHub Pages ile, main dalının kökünden. Kurulu uygulamalar yeni sürümü internet varken kendiliğinden alır.
