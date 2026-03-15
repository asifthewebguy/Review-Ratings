import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Type definitions ───────────────────────────────────────
interface DivisionData {
  nameEn: string;
  nameBn: string;
}

interface DistrictData {
  division: string;
  nameEn: string;
  nameBn: string;
}

interface SubRatingData {
  key: string;
  labelEn: string;
  labelBn: string;
  sortOrder: number;
}

interface CategoryData {
  nameEn: string;
  nameBn: string;
  slug: string;
  icon: string;
  sortOrder: number;
  subRatings: SubRatingData[];
}

// ── Upazila data (key upazilas, especially Dhaka) ─────────
const upazilas: Record<string, { nameEn: string; nameBn: string }[]> = {
  Dhaka: [
    { nameEn: 'Demra', nameBn: 'ডেমরা' },
    { nameEn: 'Dhanmondi', nameBn: 'ধানমন্ডি' },
    { nameEn: 'Gulshan', nameBn: 'গুলশান' },
    { nameEn: 'Kafrul', nameBn: 'কাফরুল' },
    { nameEn: 'Khilgaon', nameBn: 'খিলগাঁও' },
    { nameEn: 'Khilkhet', nameBn: 'খিলক্ষেত' },
    { nameEn: 'Lalbagh', nameBn: 'লালবাগ' },
    { nameEn: 'Mirpur', nameBn: 'মিরপুর' },
    { nameEn: 'Mohammadpur', nameBn: 'মোহাম্মদপুর' },
    { nameEn: 'Motijheel', nameBn: 'মতিঝিল' },
    { nameEn: 'Pallabi', nameBn: 'পল্লবী' },
    { nameEn: 'Ramna', nameBn: 'রমনা' },
    { nameEn: 'Rayer Bazar', nameBn: 'রায়ের বাজার' },
    { nameEn: 'Sabujbagh', nameBn: 'সবুজবাগ' },
    { nameEn: 'Shah Ali', nameBn: 'শাহ আলী' },
    { nameEn: 'Sher-e-Bangla Nagar', nameBn: 'শেরে বাংলা নগর' },
    { nameEn: 'Shyampur', nameBn: 'শ্যামপুর' },
    { nameEn: 'Sutrapur', nameBn: 'সূত্রাপুর' },
    { nameEn: 'Tejgaon', nameBn: 'তেজগাঁও' },
    { nameEn: 'Turag', nameBn: 'তুরাগ' },
    { nameEn: 'Uttara', nameBn: 'উত্তরা' },
    { nameEn: 'Wari', nameBn: 'ওয়ারী' },
  ],
  Gazipur: [
    { nameEn: 'Gazipur Sadar', nameBn: 'গাজীপুর সদর' },
    { nameEn: 'Kaliakair', nameBn: 'কালিয়াকৈর' },
    { nameEn: 'Kaliganj', nameBn: 'কালীগঞ্জ' },
    { nameEn: 'Kapasia', nameBn: 'কাপাসিয়া' },
    { nameEn: 'Sreepur', nameBn: 'শ্রীপুর' },
  ],
  Narayanganj: [
    { nameEn: 'Araihazar', nameBn: 'আড়াইহাজার' },
    { nameEn: 'Bandar', nameBn: 'বন্দর' },
    { nameEn: 'Narayanganj Sadar', nameBn: 'নারায়ণগঞ্জ সদর' },
    { nameEn: 'Rupganj', nameBn: 'রূপগঞ্জ' },
    { nameEn: 'Sonargaon', nameBn: 'সোনারগাঁও' },
  ],
  Chattogram: [
    { nameEn: 'Anwara', nameBn: 'আনোয়ারা' },
    { nameEn: 'Banshkhali', nameBn: 'বাঁশখালী' },
    { nameEn: 'Boalkhali', nameBn: 'বোয়ালখালী' },
    { nameEn: 'Chandanaish', nameBn: 'চন্দনাইশ' },
    { nameEn: 'Double Mooring', nameBn: 'ডাবল মুরিং' },
    { nameEn: 'Fatikchhari', nameBn: 'ফটিকছড়ি' },
    { nameEn: 'Hathazari', nameBn: 'হাটহাজারী' },
    { nameEn: 'Khulshi', nameBn: 'খুলশী' },
    { nameEn: 'Kotwali', nameBn: 'কোতোয়ালী' },
    { nameEn: 'Lohagara', nameBn: 'লোহাগাড়া' },
    { nameEn: 'Mirsharai', nameBn: 'মীরসরাই' },
    { nameEn: 'Pahartali', nameBn: 'পাহাড়তলী' },
    { nameEn: 'Patiya', nameBn: 'পটিয়া' },
    { nameEn: 'Rangunia', nameBn: 'রাঙ্গুনিয়া' },
    { nameEn: 'Raozan', nameBn: 'রাউজান' },
    { nameEn: 'Sandwip', nameBn: 'সন্দ্বীপ' },
    { nameEn: 'Satkania', nameBn: 'সাতকানিয়া' },
    { nameEn: 'Sitakunda', nameBn: 'সীতাকুণ্ড' },
  ],
  Sylhet: [
    { nameEn: 'Balaganj', nameBn: 'বালাগঞ্জ' },
    { nameEn: 'Beanibazar', nameBn: 'বিয়ানীবাজার' },
    { nameEn: 'Bishwanath', nameBn: 'বিশ্বনাথ' },
    { nameEn: 'Companiganj', nameBn: 'কোম্পানীগঞ্জ' },
    { nameEn: 'Fenchuganj', nameBn: 'ফেঞ্চুগঞ্জ' },
    { nameEn: 'Golapganj', nameBn: 'গোলাপগঞ্জ' },
    { nameEn: 'Gowainghat', nameBn: 'গোয়াইনঘাট' },
    { nameEn: 'Jaintiapur', nameBn: 'জৈন্তাপুর' },
    { nameEn: 'Kanaighat', nameBn: 'কানাইঘাট' },
    { nameEn: 'Osmani Nagar', nameBn: 'ওসমানী নগর' },
    { nameEn: 'South Surma', nameBn: 'দক্ষিণ সুরমা' },
    { nameEn: 'Sylhet Sadar', nameBn: 'সিলেট সদর' },
    { nameEn: 'Zakiganj', nameBn: 'জকিগঞ্জ' },
  ],
  Rajshahi: [
    { nameEn: 'Bagha', nameBn: 'বাঘা' },
    { nameEn: 'Bagmara', nameBn: 'বাগমারা' },
    { nameEn: 'Charghat', nameBn: 'চারঘাট' },
    { nameEn: 'Durgapur', nameBn: 'দুর্গাপুর' },
    { nameEn: 'Godagari', nameBn: 'গোদাগাড়ী' },
    { nameEn: 'Mohanpur', nameBn: 'মোহনপুর' },
    { nameEn: 'Paba', nameBn: 'পবা' },
    { nameEn: 'Puthia', nameBn: 'পুঠিয়া' },
    { nameEn: 'Rajshahi Sadar', nameBn: 'রাজশাহী সদর' },
    { nameEn: 'Tanore', nameBn: 'তানোর' },
  ],
  Khulna: [
    { nameEn: 'Batiaghata', nameBn: 'বটিয়াঘাটা' },
    { nameEn: 'Dacope', nameBn: 'দাকোপ' },
    { nameEn: 'Daulatpur', nameBn: 'দৌলতপুর' },
    { nameEn: 'Dumuria', nameBn: 'ডুমুরিয়া' },
    { nameEn: 'Dighalia', nameBn: 'দিঘলিয়া' },
    { nameEn: 'Khan Jahan Ali', nameBn: 'খান জাহান আলী' },
    { nameEn: 'Khulna Sadar', nameBn: 'খুলনা সদর' },
    { nameEn: 'Koyra', nameBn: 'কয়রা' },
    { nameEn: 'Paikgachha', nameBn: 'পাইকগাছা' },
    { nameEn: 'Phultala', nameBn: 'ফুলতলা' },
    { nameEn: 'Rupsa', nameBn: 'রূপসা' },
    { nameEn: 'Terokhada', nameBn: 'তেরখাদা' },
  ],
  Barishal: [
    { nameEn: 'Agailjhara', nameBn: 'আগৈলঝাড়া' },
    { nameEn: 'Babuganj', nameBn: 'বাবুগঞ্জ' },
    { nameEn: 'Bakerganj', nameBn: 'বাকেরগঞ্জ' },
    { nameEn: 'Banaripara', nameBn: 'বানারীপাড়া' },
    { nameEn: 'Barishal Sadar', nameBn: 'বরিশাল সদর' },
    { nameEn: 'Gournadi', nameBn: 'গৌরনদী' },
    { nameEn: 'Hizla', nameBn: 'হিজলা' },
    { nameEn: 'Mehendiganj', nameBn: 'মেহেন্দিগঞ্জ' },
    { nameEn: 'Muladi', nameBn: 'মুলাদী' },
    { nameEn: 'Wazirpur', nameBn: 'উজিরপুর' },
  ],
  Mymensingh: [
    { nameEn: 'Bhaluka', nameBn: 'ভালুকা' },
    { nameEn: 'Dhobaura', nameBn: 'ধোবাউড়া' },
    { nameEn: 'Fulbaria', nameBn: 'ফুলবাড়িয়া' },
    { nameEn: 'Gaffargaon', nameBn: 'গফরগাঁও' },
    { nameEn: 'Gauripur', nameBn: 'গৌরীপুর' },
    { nameEn: 'Haluaghat', nameBn: 'হালুয়াঘাট' },
    { nameEn: 'Ishwarganj', nameBn: 'ঈশ্বরগঞ্জ' },
    { nameEn: 'Muktagacha', nameBn: 'মুক্তাগাছা' },
    { nameEn: 'Mymensingh Sadar', nameBn: 'ময়মনসিংহ সদর' },
    { nameEn: 'Nandail', nameBn: 'নান্দাইল' },
    { nameEn: 'Phulpur', nameBn: 'ফুলপুর' },
    { nameEn: 'Trishal', nameBn: 'ত্রিশাল' },
  ],
  Rangpur: [
    { nameEn: 'Badarganj', nameBn: 'বদরগঞ্জ' },
    { nameEn: 'Gangachara', nameBn: 'গঙ্গাচড়া' },
    { nameEn: 'Kaunia', nameBn: 'কাউনিয়া' },
    { nameEn: 'Mithapukur', nameBn: 'মিঠাপুকুর' },
    { nameEn: 'Pirgachha', nameBn: 'পীরগাছা' },
    { nameEn: 'Pirganj', nameBn: 'পীরগঞ্জ' },
    { nameEn: 'Rangpur Sadar', nameBn: 'রংপুর সদর' },
    { nameEn: 'Taraganj', nameBn: 'তারাগঞ্জ' },
  ],
  Bogura: [
    { nameEn: 'Adamdighi', nameBn: 'আদমদীঘি' },
    { nameEn: 'Bogura Sadar', nameBn: 'বগুড়া সদর' },
    { nameEn: 'Dhunat', nameBn: 'ধুনট' },
    { nameEn: 'Dhupchanchia', nameBn: 'ধুপচাঁচিয়া' },
    { nameEn: 'Gabtali', nameBn: 'গাবতলী' },
    { nameEn: 'Kahaloo', nameBn: 'কাহালু' },
    { nameEn: 'Nandigram', nameBn: 'নন্দীগ্রাম' },
    { nameEn: 'Sariakandi', nameBn: 'সারিয়াকান্দি' },
    { nameEn: 'Shajahanpur', nameBn: 'শাজাহানপুর' },
    { nameEn: 'Sherpur', nameBn: 'শেরপুর' },
    { nameEn: 'Shibganj', nameBn: 'শিবগঞ্জ' },
    { nameEn: 'Sonatola', nameBn: 'সোনাতলা' },
  ],
};

async function main() {
  console.log('🌱 Starting seed...');

  // ── Load JSON data ─────────────────────────────────────
  const { default: divisionsData } = (await import('./data/divisions.json', {
    assert: { type: 'json' },
  })) as { default: DivisionData[] };

  const { default: districtsData } = (await import('./data/districts.json', {
    assert: { type: 'json' },
  })) as { default: DistrictData[] };

  const { default: categoriesData } = (await import('./data/categories.json', {
    assert: { type: 'json' },
  })) as { default: CategoryData[] };

  // ── 1. Seed Divisions ──────────────────────────────────
  console.log('📍 Seeding divisions...');
  const divisionMap = new Map<string, string>(); // nameEn -> id

  for (const div of divisionsData) {
    const existing = await prisma.division.findFirst({ where: { nameEn: div.nameEn } });
    if (existing) {
      divisionMap.set(div.nameEn, existing.id);
    } else {
      const created = await prisma.division.create({ data: div });
      divisionMap.set(div.nameEn, created.id);
    }
  }
  console.log(`  ✓ ${divisionsData.length} divisions`);

  // ── 2. Seed Districts ──────────────────────────────────
  console.log('📍 Seeding districts...');
  const districtMap = new Map<string, string>(); // nameEn -> id

  for (const dist of districtsData) {
    const divisionId = divisionMap.get(dist.division);
    if (!divisionId) {
      console.warn(`  ⚠️ Division not found for district: ${dist.nameEn}`);
      continue;
    }
    const existing = await prisma.district.findFirst({ where: { nameEn: dist.nameEn, divisionId } });
    if (existing) {
      districtMap.set(dist.nameEn, existing.id);
    } else {
      const created = await prisma.district.create({
        data: { nameEn: dist.nameEn, nameBn: dist.nameBn, divisionId },
      });
      districtMap.set(dist.nameEn, created.id);
    }
  }
  console.log(`  ✓ ${districtsData.length} districts`);

  // ── 3. Seed Upazilas ───────────────────────────────────
  console.log('📍 Seeding upazilas...');
  let upazilaCount = 0;

  for (const [districtName, upazilaList] of Object.entries(upazilas)) {
    const districtId = districtMap.get(districtName);
    if (!districtId) {
      console.warn(`  ⚠️ District not found for upazilas: ${districtName}`);
      continue;
    }
    for (const u of upazilaList) {
      const existing = await prisma.upazila.findFirst({ where: { nameEn: u.nameEn, districtId } });
      if (!existing) {
        await prisma.upazila.create({
          data: { nameEn: u.nameEn, nameBn: u.nameBn, districtId },
        });
        upazilaCount++;
      }
    }
  }
  console.log(`  ✓ ${upazilaCount} upazilas`);

  // ── 4. Seed Categories & Sub-ratings ──────────────────
  console.log('🏷️  Seeding categories...');
  let subRatingCount = 0;

  for (const cat of categoriesData) {
    const { subRatings, ...catData } = cat;
    let category = await prisma.category.findUnique({ where: { slug: cat.slug } });

    if (!category) {
      category = await prisma.category.create({ data: catData });
    }

    for (const sr of subRatings) {
      const existing = await prisma.categorySubRating.findUnique({
        where: { categoryId_key: { categoryId: category.id, key: sr.key } },
      });
      if (!existing) {
        await prisma.categorySubRating.create({
          data: { ...sr, categoryId: category.id },
        });
        subRatingCount++;
      }
    }
  }
  console.log(`  ✓ ${categoriesData.length} categories, ${subRatingCount} sub-rating definitions`);

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
