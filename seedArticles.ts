// Article Seeder - Run once to add articles to database
import { supabase } from './services/supabase';

const articles = [
    {
        title: "Namazın Faziletleri ve Manevi Faydaları",
        content: `Namaz, İslam dininin en temel ibadetlerinden biridir. Peygamber Efendimiz (sav) "Namaz dinin direğidir" buyurarak namazın İslam'daki merkezi konumunu ifade etmiştir.

Namaz kılmanın birçok faydası vardır:

**Allah ile Bağlantı:** Namaz, kulun Allah ile doğrudan bir bağ kurmasını sağlar. Bu sayede kişi kendini her an Allah'ın huzurunda hisseder ve kötü düşüncelerden uzaklaşır.

**Günahlardan Arınma:** Beş vakit namaz küçük günahlara kefaret olur. Peygamber Efendimiz, beş vakit namazı günde beş defa bir nehirde yıkanan kişinin üzerinde kir kalmamasına benzetmiştir.

**Manevi Yükseliş:** Namaz, müminin miracıdır. Kişi namaz sayesinde Allah'ın manevi huzuruna yükselir ve O'na yakınlaşır.

**Disiplin ve Düzen:** Günde beş vakit belirli zamanlarda kılınması gereken namaz, kişinin hayatına düzen ve disiplin getirir.

**Sabır ve Kuvvet:** Kur'an-ı Kerim'de "Ey inananlar, sabır ve namaz ile yardım isteyin" buyrularak namazın zorluklara karşı direnmede bir fonksiyonu olduğu belirtilmiştir.`,
        excerpt: "Namaz dinin direğidir ve günde beş vakit kılınması sayısız manevi fayda sağlar.",
        category_name: "Namaz",
        is_published: true
    },
    {
        title: "Duanın Gücü ve Etkileri",
        content: `Dua, kulun acziyetini itiraf ederek Allah'tan dünyevi veya uhrevi bir şey dilemesidir. Peygamber Efendimiz (sav) "Dua, ibadetin özüdür" buyurmuştur.

**Duanın Faydaları:**

**Manevi Gelişim:** Dua, kişinin Allah'a olan yakınlığını sürekli kılarak maneviyatını güçlendirir.

**Psikolojik İyilik:** Dua etmek, stres ve kaygıyı azaltmada etkili bir faktördür.

**Bela ve Musibetlere Karşı Koruma:** Hadis-i şeriflerde duanın yetmiş türlü kazayı önlediği belirtilmiştir.

**Günahların Affı:** Dua eden kişinin günahlarının affedilmesine vesile olabilir.`,
        excerpt: "Dua ibadetin özüdür ve kul ile Allah arasındaki en güçlü iletişim aracıdır.",
        category_name: "Dua",
        is_published: true
    },
    {
        title: "Zikir Çekmenin Faydaları",
        content: `Zikir, Allah'ı anmak ve O'nun isimlerini tekrar etmek demektir. Kur'an-ı Kerim'de "Kalpler ancak Allah'ı zikretmekle tatmin olur" buyrulmuştur.

**Zikrin Manevi Faydaları:**

**Kalbin Arınması:** Zikir kalbin pasını siler, onu tertemiz hale getirir.

**Allah'a Yakınlaşma:** Zikir, kişiyi Allah'a yaklaştırır, O'nun rızasını kazandırır.

**Şeytanın Etkisini Azaltma:** Zikir, şeytanı uzaklaştırır ve gücünü kırar.

**Huzur ve Dinginlik:** Zikir çeken kişi kendini daha güvende, daha huzurlu hisseder.`,
        excerpt: "Kalpler ancak Allah'ı zikretmekle tatmin olur ve huzur bulur.",
        category_name: "Zikir",
        is_published: true
    },
    {
        title: "Sabah Namazının Faziletleri",
        content: `Sabah namazı, beş vakit namazın en faziletli olanlarından biridir.

**Hadislerle Sabah Namazı:**

**Allah'ın Himayesi:** "Kim sabah namazını kılarsa o Allah'ın himayesindedir."

**Gece Boyu İbadet Sevabı:** "Kim sabah namazını cemaatle kılarsa, bütün gece namaz kılmış gibidir."

**Dünyadan Daha Hayırlı:** "Sabah namazının iki rekat sünneti, dünya ve dünyadaki her şeyden daha hayırlıdır."

**Cennete Giriş:** "İki serinlik namazını, sabah ve ikindiyi kılan kimse cennete girer."`,
        excerpt: "Kim sabah namazını kılarsa o Allah'ın himayesindedir.",
        category_name: "Namaz",
        is_published: true
    },
    {
        title: "Tövbe ve İstiğfarın Önemi",
        content: `Tövbe, günahlardan pişmanlık duyarak Allah'a yönelmektir. İstiğfar ise Allah'tan bağışlanma dilemektir.

**Tövbenin Şartları:**
- Günahtan pişmanlık duymak
- Günahı hemen terk etmek
- Bir daha yapmamaya karar vermek

**İstiğfarın Faydaları:**
- Günahların affedilmesine vesile olur
- Sıkıntıların giderilmesine yardımcı olur
- Rızkın bereketlenmesini sağlar`,
        excerpt: "Tövbe kapısı her zaman açıktır. Allah kullarının tövbesini kabul eder.",
        category_name: "Tövbe",
        is_published: true
    },
    {
        title: "Cuma Namazının Fazileti",
        content: `Cuma namazı, haftanın en faziletli günü olan Cuma gününde kılınan farz namazdır.

**Cuma Gününün Özellikleri:**
- Haftanın en hayırlı günüdür
- Bu günde duaların kabul olduğu bir saat vardır

**Cuma Namazının Âdabı:**
- Gusül abdesti almak
- Güzel koku sürünmek
- Cuma namazına erken gitmek
- Kehf Suresi'ni okumak`,
        excerpt: "Cuma, haftanın en hayırlı günüdür ve Allah'ın özel lütuflarla dolu vaktidir.",
        category_name: "Namaz",
        is_published: true
    },
    {
        title: "Ramazan ve Oruç İbadeti",
        content: `Ramazan ayı, İslam'ın beş şartından biri olan oruç ibadetinin tutulduğu mübarek aydır.

**Orucun Faydaları:**
- Takva kazandırır
- Nefsi terbiye eder
- Sabır öğretir
- Şükür duygusunu artırır

**Ramazan Ayının Önemli Geceleri:**
- Kadir Gecesi: Bin aydan hayırlıdır`,
        excerpt: "Ramazan ayı, bin aydan hayırlı olan Kadir Gecesi'ni barındıran mübarek bir aydır.",
        category_name: "Oruç",
        is_published: true
    },
    {
        title: "Güzel Ahlakın Önemi",
        content: `Peygamber Efendimiz (sav) "Ben güzel ahlakı tamamlamak için gönderildim" buyurmuştur.

**Güzel Ahlakın Özellikleri:**
- Doğruluk (Sıdk)
- Emanete Riayet
- Ahde Vefa
- Sabır
- Şükür
- Tevazu
- Merhamet

**Güzel Ahlakın Mükafatı:**
- Allah'ın sevgisini kazandırır
- Ahirette yüksek dereceler kazandırır`,
        excerpt: "Ben güzel ahlakı tamamlamak için gönderildim. - Hz. Muhammed (sav)",
        category_name: "Ahlak",
        is_published: true
    },
    {
        title: "Sadaka ve İnfakın Fazileti",
        content: `Sadaka, Allah rızası için yapılan her türlü iyilik ve yardımdır.

**Sadakanın Faydaları:**
- Günahları örter ve siler
- Belaları defeder
- Malı bereketlendirir
- Cehennem ateşinden korur

**En Faziletli Sadaka:**
- Yakınlara verilen
- Gizlice verilen
- İhtiyaç sahibine verilen`,
        excerpt: "Sadaka malı eksiltmez, aksine bereketlendirir ve belaları defeder.",
        category_name: "Sadaka",
        is_published: true
    },
    {
        title: "Anne-Baba Hakkı",
        content: `İslam'da anne-baba hakkı, Allah'a kulluktan hemen sonra gelir.

**Kur'an'da:**
- "Rabbin sadece kendisine ibadet etmenizi ve anne-babaya iyilik yapmanızı emretti"
- "Onlara öf bile deme"

**Hadislerde:**
- "Cennet annelerin ayakları altındadır"
- "Allah'ın rızası, anne-babanın rızasındadır"`,
        excerpt: "Allah'ın rızası anne-babanın rızasında, gazabı da onların gazabındadır.",
        category_name: "Aile",
        is_published: true
    },
    {
        title: "Kur'an-ı Kerim Okumanın Fazileti",
        content: `Kur'an-ı Kerim, Allah'ın son kelamıdır. Onu okumak, anlamak ve yaşamak her Müslümanın görevidir.

**Kur'an Okumanın Faydaları:**
- Her harf için on sevap kazanılır
- Kıyamet günü şefaatçi olur
- Kalbi nurlandırır
- Şeytanı uzaklaştırır

**Hadis:** "İnsanların en hayırlısı, Kur'an'ı öğrenen ve öğretendir"`,
        excerpt: "İnsanların en hayırlısı Kur'an'ı öğrenen ve öğretendir.",
        category_name: "Kur'an",
        is_published: true
    },
    {
        title: "Gece Namazının (Teheccüd) Fazileti",
        content: `Teheccüd namazı, gece uykudan kalkarak kılınan nafile namazdır.

**Hadisler:**
- "Farz namazlardan sonra en faziletli namaz, gece namazıdır"
- "Rabbe en yakın olduğumuz vakit, gecenin son üçte biridir"

**Teheccüd Namazının Faydaları:**
- Allah'a en yakın olunan vakitte ibadettir
- Duaların kabul olma ihtimali yüksektir
- Günahlardan arınmaya vesile olur`,
        excerpt: "Farz namazlardan sonra en faziletli namaz, gece namazıdır.",
        category_name: "Namaz",
        is_published: true
    },
    {
        title: "Sılayı Rahim: Akraba Ziyareti",
        content: `Sılayı rahim, akrabalık bağlarını korumak ve akrabaları ziyaret etmektir.

**Hadislerde:**
- "Sılayı rahim ömrü uzatır, rızkı bereketlendirir"
- "Akrabalık bağını koparan cennete giremez"

**Sılayı Rahimin Şekilleri:**
- Ziyaret etmek
- Telefonla aramak
- Hediye göndermek
- Maddi yardım etmek`,
        excerpt: "Sılayı rahim (akraba ziyareti) ömrü uzatır, rızkı bereketlendirir.",
        category_name: "Aile",
        is_published: true
    },
    {
        title: "Tefekkür ve Tedebbür",
        content: `Tefekkür, Allah'ın yarattıkları üzerinde düşünmektir.

**Tefekkürün Faydaları:**
- Allah'ın kudretini görmeyi sağlar
- Yaratılışın hikmetini anlamaya yardımcı olur
- Kalbi yumuşatır

**Kur'an'da:**
- "Göklerin ve yerin yaratılışında düşünenler için ayetler vardır"

**Hadis:** "Bir saat tefekkür, bir yıllık nafile ibadetten hayırlıdır."`,
        excerpt: "Göklerin ve yerin yaratılışında düşünenler için nice ayetler vardır.",
        category_name: "Tefekkür",
        is_published: true
    },
    {
        title: "Sabır ve Şükür Dengesi",
        content: `Sabır ve şükür, müminin en önemli iki özelliğidir.

**Sabır:** Zorluklara karşı direnmek, Allah'ın takdirine razı olmak.

**Şükür:** Nimetler karşısında Allah'a minnettar olmak.

**Hadis:** "Müminin işi ne güzeldir! Nimetlendiğinde şükreder, sıkıntıya uğradığında sabreder."`,
        excerpt: "Sabırlılarla beraberim diyen Allah, şükredenlere nimetlerini artırır.",
        category_name: "Sabır",
        is_published: true
    },
    {
        title: "İhlas Suresi ve Faziletleri",
        content: `İhlas Suresi, Kur'an-ı Kerim'in en faziletli surelerinden biridir.

**Surenin Manası:**
"De ki: O Allah birdir. Allah Samed'dir. Doğurmamış ve doğmamıştır. Hiçbir şey O'na denk değildir."

**Fazileti:**
- Kur'an'ın üçte birine denktir
- Cennet kapılarını açar

**Ne Zaman Okunur:**
- Sabah akşam 3'er kere
- Namaz sonlarında
- Yatmadan önce`,
        excerpt: "İhlas Suresi, Kur'an'ın üçte birine denktir ve büyük faziletler barındırır.",
        category_name: "Kur'an",
        is_published: true
    },
    {
        title: "Ayetel Kürsi'nin Fazileti",
        content: `Ayetel Kürsi (Bakara Suresi, 255. ayet), Kur'an-ı Kerim'in en faziletli ayetlerinden biridir.

**Fazileti:**
- Kur'an'ın en büyük ayetidir
- Sabah akşam okunduğunda koruma sağlar
- Her farz namazdan sonra okuyanı cennetten sadece ölüm ayırır
- Yatarken okuyan, sabaha kadar koruma altındadır`,
        excerpt: "Ayetel Kürsi, Kur'an'ın en büyük ayetidir ve büyük koruma sağlar.",
        category_name: "Kur'an",
        is_published: true
    },
    {
        title: "Sabah ve Akşam Zikirleri",
        content: `Peygamber Efendimiz (sav), sabah ve akşam vakitlerinde düzenli zikirler tavsiye etmiştir.

**Okunacak Zikirler:**
- Ayetel Kürsi: 1 kere
- İhlas, Felak, Nas Sureleri: 3'er kere
- Sübhanallahi ve bihamdihi: 100 kere

**Hadis:** "Her kim bunları sabah ve akşam söylerse, ona hiçbir şey zarar veremez."`,
        excerpt: "Sabah ve akşam zikirleri, gün boyunca koruma ve bereket sağlar.",
        category_name: "Zikir",
        is_published: true
    },
    {
        title: "Vakitlerde Namaz Kılmak",
        content: `Namazı vaktinde kılmak, Allah'a en sevimli amellerdendir.

**Hadis:** "Allah'a en sevimli amel hangisidir?" sorusuna Peygamberimiz: "Vaktinde kılınan namazdır" buyurmuştur.

**Namaz Vakitleri:**
1. Sabah: Fecr-i sadıktan güneş doğana kadar
2. Öğle: Güneşin tepe noktasından geçmesiyle
3. İkindi: Gölge iki katına çıkınca
4. Akşam: Güneş battığında
5. Yatsı: Akşam kızıllığı kaybolduğunda`,
        excerpt: "Allah'a en sevimli amel, vaktinde kılınan namazdır.",
        category_name: "Namaz",
        is_published: true
    },
    {
        title: "Komşu Hakkı",
        content: `İslam'da komşu hakkı çok önemlidir.

**Hadisler:**
- "Komşusu aç iken tok yatan bizden değildir"
- "Kim Allah'a ve ahiret gününe inanıyorsa komşusuna iyilik etsin"

**Komşuya Karşı Görevler:**
- Selam vermek
- Hasta olunca ziyaret etmek
- Sıkıntısında yardım etmek
- Yapılan yemekten ikram etmek`,
        excerpt: "Cebrail, komşu hakkını o kadar vurguladı ki, onu mirasçı sanıyordum.",
        category_name: "Toplum",
        is_published: true
    }
];

export async function seedArticles() {
    console.log('Starting to seed articles...');

    const categoryMap: Record<string, string> = {};
    const uniqueCategories = [...new Set(articles.map(a => a.category_name))];

    for (const categoryName of uniqueCategories) {
        const { data: existing } = await supabase
            .from('article_categories')
            .select('id')
            .eq('name', categoryName)
            .single();

        if (existing) {
            categoryMap[categoryName] = existing.id;
            console.log('Category exists: ' + categoryName);
        } else {
            const slug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const { data: newCat, error } = await supabase
                .from('article_categories')
                .insert({ name: categoryName, slug })
                .select('id')
                .single();

            if (newCat) {
                categoryMap[categoryName] = newCat.id;
                console.log('Created category: ' + categoryName);
            } else {
                console.error('Failed to create category ' + categoryName + ':', error);
            }
        }
    }

    let successCount = 0;
    for (const article of articles) {
        const slug = article.title.toLowerCase()
            .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
            .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

        const { error } = await supabase
            .from('articles')
            .insert({
                title: article.title,
                slug,
                content: article.content,
                excerpt: article.excerpt,
                category_id: categoryMap[article.category_name],
                is_published: true,
                published_at: new Date().toISOString(),
                view_count: Math.floor(Math.random() * 50) + 10
            });

        if (!error) {
            successCount++;
            console.log('Added: ' + article.title);
        } else {
            console.error('Failed: ' + article.title, error);
        }
    }

    console.log('Seeding complete! Added ' + successCount + '/' + articles.length + ' articles.');
}
