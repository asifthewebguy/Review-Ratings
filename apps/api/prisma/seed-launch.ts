import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 200 realistic Dhaka businesses across 9 categories
const BUSINESSES = [
  // E-Commerce (20)
  { name: 'চালডাল.কম', slug: 'chaldal', category: 'ecommerce', description: 'বাংলাদেশের সেরা অনলাইন গ্রোসারি শপ। দ্রুত ডেলিভারি ও সেরা মানের পণ্য।' },
  { name: 'শপআপ বিডি', slug: 'shopup-bd', category: 'ecommerce', description: 'বি২বি ই-কমার্স প্ল্যাটফর্ম। ক্ষুদ্র ব্যবসায়ীদের জন্য সেরা পছন্দ।' },
  { name: 'দারাজ বাংলাদেশ', slug: 'daraz-bd', category: 'ecommerce', description: 'বাংলাদেশের সবচেয়ে বড় অনলাইন শপিং প্ল্যাটফর্ম।' },
  { name: 'প্রিয়শপ', slug: 'priyoshop', category: 'ecommerce', description: 'ইলেকট্রনিক্স ও গ্যাজেটের জন্য সেরা অনলাইন শপ।' },
  { name: 'বাগডুম', slug: 'bagdoom', category: 'ecommerce', description: 'ফ্যাশন ও লাইফস্টাইল পণ্যের অনলাইন মার্কেটপ্লেস।' },
  { name: 'আজকের ডিল', slug: 'ajkerdeal', category: 'ecommerce', description: 'প্রতিদিনের সেরা অফার ও ডিসকাউন্ট।' },
  { name: 'ক্লিক বিডি', slug: 'click-bd', category: 'ecommerce', description: 'ইলেকট্রনিক্স পণ্যের বিশ্বস্ত অনলাইন বিক্রেতা।' },
  { name: 'রকমারি', slug: 'rokomari', category: 'ecommerce', description: 'বই ও শিক্ষামূলক উপকরণের সেরা অনলাইন শপ।' },
  { name: 'পিকাবো', slug: 'picabo', category: 'ecommerce', description: 'মায়েদের ও শিশুদের পণ্যের বিশেষায়িত শপ।' },
  { name: 'শাজগোজ', slug: 'shajgoj', category: 'ecommerce', description: 'বিউটি ও স্কিনকেয়ার পণ্যের অনলাইন ডেস্টিনেশন।' },
  { name: 'ওথবা', slug: 'othoba', category: 'ecommerce', description: 'কম দামে ভালো পণ্য। বিশ্বস্ত অনলাইন শপ।' },
  { name: 'সহজ শপ', slug: 'shohoj-shop', category: 'ecommerce', description: 'সহজে কেনাকাটার জন্য সেরা প্ল্যাটফর্ম।' },
  { name: 'গ্রামীণফোন শপ', slug: 'gp-shop', category: 'ecommerce', description: 'মোবাইল ও টেলিযোগাযোগ পণ্যের অফিশিয়াল শপ।' },
  { name: 'স্টার টেক', slug: 'startech', category: 'ecommerce', description: 'কম্পিউটার ও আইটি পণ্যের বিশ্বস্ত বিক্রেতা।' },
  { name: 'রাইয়ান্স কম্পিউটার্স', slug: 'ryans-computers', category: 'ecommerce', description: 'ল্যাপটপ ও কম্পিউটার পেরিফেরালসের শীর্ষ বিক্রেতা।' },
  { name: 'উইন্টেক', slug: 'wintech', category: 'ecommerce', description: 'গেমিং পণ্য ও অ্যাক্সেসরিজের বিশেষায়িত শপ।' },
  { name: 'পণ্যসব', slug: 'ponnosob', category: 'ecommerce', description: 'হোম অ্যাপ্লায়েন্স ও গৃহস্থালি পণ্যের অনলাইন শপ।' },
  { name: 'নগদ শপ', slug: 'nagad-shop', category: 'ecommerce', description: 'মোবাইল ব্যাংকিং ইন্টিগ্রেটেড শপিং প্ল্যাটফর্ম।' },
  { name: 'বিকাশ পে শপ', slug: 'bkash-pay-shop', category: 'ecommerce', description: 'বিকাশ পেমেন্ট সমর্থিত অনলাইন মার্কেটপ্লেস।' },
  { name: 'ফুডপ্যান্ডা মার্ট', slug: 'foodpanda-mart', category: 'ecommerce', description: 'দ্রুত গ্রোসারি ডেলিভারি সার্ভিস।' },

  // F-Commerce (20)
  { name: 'বিউটি বাংলাদেশ', slug: 'beauty-bd', category: 'fcommerce', description: 'ফেসবুক পেজ ভিত্তিক বিউটি পণ্যের শীর্ষ বিক্রেতা।' },
  { name: 'ফ্যাশন হাউস ঢাকা', slug: 'fashion-house-dhaka', category: 'fcommerce', description: 'ট্রেন্ডি পোশাক ও ফ্যাশন আইটেমের এফ-কমার্স পেজ।' },
  { name: 'হস্তশিল্প বাড়ি', slug: 'hastoshilpo-bari', category: 'fcommerce', description: 'বাংলাদেশি হ্যান্ডিক্রাফট ও দেশীয় পণ্যের বিক্রেতা।' },
  { name: 'অর্গানিক ফার্ম বিডি', slug: 'organic-farm-bd', category: 'fcommerce', description: 'জৈব কৃষি পণ্য ও প্রাকৃতিক খাবারের বিক্রেতা।' },
  { name: 'কিডস ওয়ার্ল্ড বিডি', slug: 'kids-world-bd', category: 'fcommerce', description: 'শিশুদের খেলনা ও পোশাকের ফেসবুক শপ।' },
  { name: 'গহনা গৃহ', slug: 'gohona-griho', category: 'fcommerce', description: 'ঐতিহ্যবাহী গহনা ও জুয়েলারির অনলাইন শপ।' },
  { name: 'হোম ডেকর বিডি', slug: 'home-decor-bd', category: 'fcommerce', description: 'ঘর সাজানোর জিনিস ও ইন্টেরিয়র আইটেমের বিক্রেতা।' },
  { name: 'ফিটনেস গিয়ার বিডি', slug: 'fitness-gear-bd', category: 'fcommerce', description: 'ব্যায়ামের সরঞ্জাম ও স্বাস্থ্য পণ্যের এফ-কমার্স।' },
  { name: 'পেট কেয়ার বিডি', slug: 'pet-care-bd', category: 'fcommerce', description: 'পোষা প্রাণীর খাবার ও যত্নের পণ্যের বিক্রেতা।' },
  { name: 'বই পড়ুয়া', slug: 'boi-poruya', category: 'fcommerce', description: 'পুরনো ও নতুন বইয়ের ফেসবুক মার্কেটপ্লেস।' },
  { name: 'আর্ট গ্যালারি বিডি', slug: 'art-gallery-bd', category: 'fcommerce', description: 'বাংলাদেশি শিল্পীদের আঁকা ছবি ও আর্টওয়ার্ক।' },
  { name: 'ক্যান্ডেল হাউস', slug: 'candle-house', category: 'fcommerce', description: 'হ্যান্ডমেড মোমবাতি ও সুগন্ধি পণ্যের বিক্রেতা।' },
  { name: 'ব্যাগ বাজার', slug: 'bag-bazar', category: 'fcommerce', description: 'হ্যান্ডব্যাগ ও লাগেজের অনলাইন শপ।' },
  { name: 'স্পোর্টস বিডি', slug: 'sports-bd', category: 'fcommerce', description: 'ক্রীড়া সামগ্রী ও স্পোর্টসওয়্যারের বিক্রেতা।' },
  { name: 'কটন ল্যান্ড', slug: 'cotton-land', category: 'fcommerce', description: 'খাঁটি কটনের পোশাক ও কাপড়ের বিক্রেতা।' },
  { name: 'সুন্দরবন বিউটি', slug: 'sundarban-beauty', category: 'fcommerce', description: 'প্রাকৃতিক উপাদানে তৈরি বিউটি পণ্যের শপ।' },
  { name: 'টেক গ্যাজেট বিডি', slug: 'tech-gadget-bd', category: 'fcommerce', description: 'সর্বশেষ গ্যাজেট ও ইলেকট্রনিক আইটেম।' },
  { name: 'বাংলা ব্লক প্রিন্ট', slug: 'bangla-block-print', category: 'fcommerce', description: 'ঐতিহ্যবাহী ব্লক প্রিন্টের কাপড় ও পোশাক।' },
  { name: 'ক্র্যাফট কর্নার', slug: 'craft-corner', category: 'fcommerce', description: 'ক্র্যাফটিং সরঞ্জাম ও ডিআইওয়াই কিটের বিক্রেতা।' },
  { name: 'বেবি নেস্ট বিডি', slug: 'baby-nest-bd', category: 'fcommerce', description: 'নবজাতক ও ছোট শিশুর পণ্যের বিশেষায়িত শপ।' },

  // Restaurants (25)
  { name: 'কাচ্চি ভাই রেস্তোরাঁ', slug: 'kacchi-bhai', category: 'restaurants', description: 'ঢাকার বিখ্যাত কাচ্চি বিরিয়ানি রেস্তোরাঁ। ৩০ বছরের ঐতিহ্য।' },
  { name: 'হাজীর বিরিয়ানি', slug: 'hajir-biryani', category: 'restaurants', description: 'পুরান ঢাকার ঐতিহ্যবাহী মোগলাই বিরিয়ানি।' },
  { name: 'নান্না বিরিয়ানি', slug: 'nanna-biryani', category: 'restaurants', description: 'ইলিশ বিরিয়ানির জন্য বিখ্যাত ঢাকার রেস্তোরাঁ।' },
  { name: 'স্টার কাবাব', slug: 'star-kabab', category: 'restaurants', description: 'তন্দুরি কাবাব ও মোগলাই খাবারের জনপ্রিয় রেস্তোরাঁ।' },
  { name: 'চায়না টাউন রেস্তোরাঁ', slug: 'china-town', category: 'restaurants', description: 'অথেনটিক চাইনিজ কুইজিনের জন্য সেরা গন্তব্য।' },
  { name: 'পিৎজা হাট বাংলাদেশ', slug: 'pizza-hut-bd', category: 'restaurants', description: 'আন্তর্জাতিক মানের পিৎজা ও পাস্তা রেস্তোরাঁ।' },
  { name: 'শর্মা ইন বাংলাদেশ', slug: 'sharma-inn', category: 'restaurants', description: 'ভারতীয় ও মোগলাই খাবারের বিশেষায়িত রেস্তোরাঁ।' },
  { name: 'সী-ফুড প্যারাডাইস', slug: 'seafood-paradise', category: 'restaurants', description: 'তাজা সামুদ্রিক মাছ ও সী-ফুডের রেস্তোরাঁ।' },
  { name: 'ভেজি গার্ডেন', slug: 'veggie-garden', category: 'restaurants', description: 'সম্পূর্ণ নিরামিষ রেস্তোরাঁ। স্বাস্থ্যকর খাবার।' },
  { name: 'বার্গার ল্যাব', slug: 'burger-lab', category: 'restaurants', description: 'আর্টিসান বার্গার ও স্মোকড মিটের জনপ্রিয় আউটলেট।' },
  { name: 'সুশি বার ঢাকা', slug: 'sushi-bar-dhaka', category: 'restaurants', description: 'ঢাকার সেরা জাপানি কুইজিন ও সুশি রেস্তোরাঁ।' },
  { name: 'মেক্সিকান গ্রিল বিডি', slug: 'mexican-grill-bd', category: 'restaurants', description: 'অথেনটিক মেক্সিকান টেকো ও বুরিটোর রেস্তোরাঁ।' },
  { name: 'কফি হাউস ঢাকা', slug: 'coffee-house-dhaka', category: 'restaurants', description: 'আর্টিসান কফি ও লাইট মিলসের ক্যাফে।' },
  { name: 'মিষ্টি ঘর', slug: 'mishti-ghor', category: 'restaurants', description: 'ঐতিহ্যবাহী বাংলাদেশি মিষ্টি ও দেশীয় মিষ্টান্নের দোকান।' },
  { name: 'তেহারি হাউস', slug: 'tehari-house', category: 'restaurants', description: 'পুরান ঢাকার ঐতিহ্যবাহী তেহারি ও খিচুড়ি রেস্তোরাঁ।' },
  { name: 'মা কিচেন', slug: 'maa-kitchen', category: 'restaurants', description: 'ঘরোয়া স্বাদের বাংলাদেশি রান্নার রেস্তোরাঁ।' },
  { name: 'থাই গার্ডেন ঢাকা', slug: 'thai-garden-dhaka', category: 'restaurants', description: 'অথেনটিক থাই কুইজিনের সেরা রেস্তোরাঁ।' },
  { name: 'রুফটপ গ্রিল', slug: 'rooftop-grill', category: 'restaurants', description: 'ছাদের উপরে ডাইনিং অভিজ্ঞতা ও বারবিকিউ।' },
  { name: 'দেশি খাবার ঘর', slug: 'deshi-khabar-ghor', category: 'restaurants', description: 'খাঁটি দেশীয় রান্না। ভর্তা, ভাজি ও তরকারি।' },
  { name: 'স্পাইস গার্ডেন', slug: 'spice-garden', category: 'restaurants', description: 'ঐতিহ্যবাহী মশলাদার বাংলাদেশি ও ভারতীয় কুইজিন।' },
  { name: 'ফুড কোর্ট যমুনা', slug: 'yamuna-food-court', category: 'restaurants', description: 'যমুনা ফিউচার পার্কের বিখ্যাত ফুড কোর্ট।' },
  { name: 'সৌদি রেস্তোরাঁ ঢাকা', slug: 'saudi-restaurant-dhaka', category: 'restaurants', description: 'আরবীয় গ্রিল ও মধ্যপ্রাচ্যের খাবারের রেস্তোরাঁ।' },
  { name: 'পান্তা ইলিশ রেস্তোরাঁ', slug: 'panta-ilish', category: 'restaurants', description: 'বাংলাদেশের জাতীয় খাবার পান্তা-ইলিশের বিশেষায়িত রেস্তোরাঁ।' },
  { name: 'মেরিন ড্রাইভ ডাইনার', slug: 'marine-drive-diner', category: 'restaurants', description: 'সুন্দর পরিবেশে পশ্চিমা ও বাংলাদেশি মিক্সড কুইজিন।' },
  { name: 'হালিম হাউস', slug: 'haleem-house', category: 'restaurants', description: 'ঐতিহ্যবাহী হালিম ও মোগলাই খাবারের বিখ্যাত রেস্তোরাঁ।' },

  // Food Delivery (15)
  { name: 'ফুডপ্যান্ডা বাংলাদেশ', slug: 'foodpanda-bangladesh', category: 'food-delivery', description: 'বাংলাদেশের সেরা ফুড ডেলিভারি অ্যাপ। ৩০০+ রেস্তোরাঁ পার্টনার।' },
  { name: 'শহর', slug: 'shohoz-food', category: 'food-delivery', description: 'দ্রুত ফুড ডেলিভারি ও রাইড শেয়ারিং সার্ভিস।' },
  { name: 'পাঠাও ফুড', slug: 'pathao-food', category: 'food-delivery', description: 'পাঠাওর ফুড ডেলিভারি সার্ভিস। দ্রুত ও নির্ভরযোগ্য।' },
  { name: 'হাংরি নাকি', slug: 'hungry-naki', category: 'food-delivery', description: 'হোম কুকড খাবারের ডেলিভারি প্ল্যাটফর্ম।' },
  { name: 'মিলবক্স', slug: 'mealbox', category: 'food-delivery', description: 'অফিস ও কর্পোরেট লাঞ্চ ডেলিভারি সার্ভিস।' },
  { name: 'কিচেন ক্লাউড', slug: 'kitchen-cloud', category: 'food-delivery', description: 'ক্লাউড কিচেন থেকে সরাসরি ডেলিভারি সার্ভিস।' },
  { name: 'ডেলিভারি টাইগার', slug: 'delivery-tiger', category: 'food-delivery', description: 'ই-কমার্স ও ফুড ডেলিভারি লজিস্টিক্স সার্ভিস।' },
  { name: 'চাই পে', slug: 'chai-pe', category: 'food-delivery', description: 'চা ও হালকা নাস্তার দ্রুত ডেলিভারি সার্ভিস।' },
  { name: 'হোমচেফ বিডি', slug: 'homechef-bd', category: 'food-delivery', description: 'বাড়ির তৈরি খাবারের নির্ভরযোগ্য ডেলিভারি প্ল্যাটফর্ম।' },
  { name: 'নাস্তা বক্স', slug: 'nasta-box', category: 'food-delivery', description: 'সকালের নাস্তা ও টিফিন ডেলিভারি সার্ভিস।' },
  { name: 'গ্রিন মিল ডেলিভারি', slug: 'green-meal-delivery', category: 'food-delivery', description: 'স্বাস্থ্যকর ও অর্গানিক খাবারের ডেলিভারি সার্ভিস।' },
  { name: 'বাচ্চাদের টিফিন', slug: 'bachhadr-tiffin', category: 'food-delivery', description: 'স্কুলের শিশুদের জন্য পুষ্টিকর টিফিন ডেলিভারি।' },
  { name: 'রাতের খাবার', slug: 'rater-khabar', category: 'food-delivery', description: 'রাতের খাবারের জন্য দ্রুত ডেলিভারি সার্ভিস।' },
  { name: 'রান্নাঘর ডেলিভারি', slug: 'rannaghar-delivery', category: 'food-delivery', description: 'ঘরোয়া রান্নার স্বাদে ডেলিভারি সার্ভিস।' },
  { name: 'বড় ভাই কিচেন', slug: 'boro-bhai-kitchen', category: 'food-delivery', description: 'বড় পরিবারের জন্য বাল্ক ফুড ডেলিভারি সার্ভিস।' },

  // Banks (20)
  { name: 'ডাচ-বাংলা ব্যাংক', slug: 'dbbl', category: 'banks', description: 'বাংলাদেশের অন্যতম বৃহত্তম বেসরকারি ব্যাংক। বিশ্বস্ত ব্যাংকিং সেবা।' },
  { name: 'ব্র্যাক ব্যাংক', slug: 'brac-bank', category: 'banks', description: 'এসএমই ব্যাংকিংয়ে বাংলাদেশের শীর্ষস্থানীয় ব্যাংক।' },
  { name: 'ইসলামী ব্যাংক বাংলাদেশ', slug: 'ibbl', category: 'banks', description: 'শরীয়াহ ভিত্তিক ইসলামিক ব্যাংকিং সার্ভিস।' },
  { name: 'সিটি ব্যাংক বাংলাদেশ', slug: 'city-bank-bd', category: 'banks', description: 'আধুনিক ডিজিটাল ব্যাংকিং সেবা ও ক্রেডিট কার্ড সুবিধা।' },
  { name: 'ইস্টার্ন ব্যাংক', slug: 'ebl', category: 'banks', description: 'উদ্যোক্তা ও ব্যবসায়ীদের জন্য বিশেষায়িত ব্যাংকিং সেবা।' },
  { name: 'মিউচুয়াল ট্রাস্ট ব্যাংক', slug: 'mtb', category: 'banks', description: 'ব্যক্তিগত ও কর্পোরেট ব্যাংকিংয়ে বিশ্বস্ত নাম।' },
  { name: 'প্রাইম ব্যাংক', slug: 'prime-bank', category: 'banks', description: 'প্রিমিয়াম ব্যাংকিং সেবা ও বিনিয়োগ পরামর্শ।' },
  { name: 'উত্তরা ব্যাংক', slug: 'uttara-bank', category: 'banks', description: 'দেশব্যাপী বিস্তৃত নেটওয়ার্কের বাণিজ্যিক ব্যাংক।' },
  { name: 'মার্কেন্টাইল ব্যাংক', slug: 'mercantile-bank', category: 'banks', description: 'ট্রেড ফাইন্যান্স ও এলসি সেবায় বিশেষজ্ঞ ব্যাংক।' },
  { name: 'ন্যাশনাল ব্যাংক', slug: 'national-bank-bd', category: 'banks', description: 'দেশের অন্যতম পুরনো ও বিশ্বস্ত বেসরকারি ব্যাংক।' },
  { name: 'এনসিসি ব্যাংক', slug: 'ncc-bank', category: 'banks', description: 'গ্রাহককেন্দ্রিক ব্যাংকিং সেবা প্রদানে অগ্রণী।' },
  { name: 'ঢাকা ব্যাংক', slug: 'dhaka-bank', category: 'banks', description: 'ডিজিটাল ব্যাংকিং ও ইন্টারনেট ব্যাংকিং সেবায় পায়োনিয়ার।' },
  { name: 'সোনালী ব্যাংক', slug: 'sonali-bank', category: 'banks', description: 'বাংলাদেশের বৃহত্তম রাষ্ট্রায়ত্ত বাণিজ্যিক ব্যাংক।' },
  { name: 'জনতা ব্যাংক', slug: 'janata-bank', category: 'banks', description: 'কৃষি ও গ্রামীণ ব্যাংকিং সেবায় বিশেষজ্ঞ।' },
  { name: 'অগ্রণী ব্যাংক', slug: 'agrani-bank', category: 'banks', description: 'শিল্প ঋণ ও প্রকল্প অর্থায়নে অভিজ্ঞ সরকারি ব্যাংক।' },
  { name: 'রূপালী ব্যাংক', slug: 'rupali-bank', category: 'banks', description: 'প্রবাসী রেমিট্যান্স সেবায় বিশেষজ্ঞ সরকারি ব্যাংক।' },
  { name: 'স্ট্যান্ডার্ড চার্টার্ড বিডি', slug: 'scb-bd', category: 'banks', description: 'আন্তর্জাতিক ব্যাংকিং সেবা ও ওয়েলথ ম্যানেজমেন্ট।' },
  { name: 'এইচএসবিসি বাংলাদেশ', slug: 'hsbc-bd', category: 'banks', description: 'গ্লোবাল ব্যাংকিং ও ট্রেড ফাইন্যান্স সেবা।' },
  { name: 'সিটিব্যাংক এনএ বিডি', slug: 'citibank-bd', category: 'banks', description: 'কর্পোরেট ব্যাংকিং ও ইন্টারন্যাশনাল ট্রানজেকশন।' },
  { name: 'ব্যাংক এশিয়া', slug: 'bank-asia', category: 'banks', description: 'এজেন্ট ব্যাংকিং ও মোবাইল ফাইন্যান্সিয়াল সার্ভিসে পায়োনিয়ার।' },

  // MFS (10)
  { name: 'বিকাশ', slug: 'bkash', category: 'mfs', description: 'বাংলাদেশের সবচেয়ে জনপ্রিয় মোবাইল ব্যাংকিং সার্ভিস।' },
  { name: 'নগদ', slug: 'nagad', category: 'mfs', description: 'ডাক বিভাগের ডিজিটাল ফাইন্যান্সিয়াল সার্ভিস।' },
  { name: 'রকেট', slug: 'rocket-dbbl', category: 'mfs', description: 'ডাচ-বাংলা ব্যাংকের মোবাইল ব্যাংকিং সার্ভিস।' },
  { name: 'উপায়', slug: 'upay', category: 'mfs', description: 'ইউসিবি ব্যাংকের ডিজিটাল পেমেন্ট প্ল্যাটফর্ম।' },
  { name: 'মোবাইক্যাশ', slug: 'mobicash', category: 'mfs', description: 'মোবাইল আর্থিক লেনদেনের নির্ভরযোগ্য সার্ভিস।' },
  { name: 'ওকে ওয়ালেট', slug: 'ok-wallet', category: 'mfs', description: 'ওয়ান ব্যাংকের ডিজিটাল পেমেন্ট সমাধান।' },
  { name: 'ট্রাস্ট এক্সিওরি', slug: 'trust-axiata', category: 'mfs', description: 'রবির সাথে ট্রাস্ট ব্যাংকের মোবাইল ফাইন্যান্সিয়াল সার্ভিস।' },
  { name: 'শিওরক্যাশ', slug: 'surecash', category: 'mfs', description: 'রূপালী ব্যাংকের মোবাইল ব্যাংকিং সার্ভিস।' },
  { name: 'মাইক্যাশ', slug: 'mycash', category: 'mfs', description: 'মার্কেন্টাইল ব্যাংকের মোবাইল ফাইন্যান্সিয়াল সার্ভিস।' },
  { name: 'ইসলামিক ওয়ালেট', slug: 'islamic-wallet', category: 'mfs', description: 'শরীয়াহ সম্মত ইসলামিক ডিজিটাল ওয়ালেট সার্ভিস।' },

  // Hospitals (30)
  { name: 'স্কয়ার হাসপাতাল', slug: 'square-hospital', category: 'hospitals', description: 'ঢাকার অন্যতম সেরা বেসরকারি হাসপাতাল। আন্তর্জাতিক মানের সেবা।' },
  { name: 'ইউনাইটেড হাসপাতাল', slug: 'united-hospital', category: 'hospitals', description: 'জয়েন্ট কমিশন ইন্টারন্যাশনাল অ্যাক্রিডিটেড হাসপাতাল।' },
  { name: 'এভারকেয়ার হাসপাতাল', slug: 'evercare-hospital', category: 'hospitals', description: 'সর্বাধুনিক চিকিৎসা প্রযুক্তি ও বিশেষজ্ঞ চিকিৎসক।' },
  { name: 'ল্যাবএইড হাসপাতাল', slug: 'labaid-hospital', category: 'hospitals', description: 'ডায়াগনস্টিক ও বিশেষায়িত চিকিৎসা সেবা।' },
  { name: 'আনোয়ার খান মডার্ন হাসপাতাল', slug: 'anwar-khan-modern', category: 'hospitals', description: 'সাশ্রয়ী মূল্যে উন্নত মানের চিকিৎসা সেবা।' },
  { name: 'ইবনে সিনা হাসপাতাল', slug: 'ibn-sina-hospital', category: 'hospitals', description: 'সামগ্রিক স্বাস্থ্যসেবায় বিখ্যাত বেসরকারি হাসপাতাল।' },
  { name: 'ডেলটা মেডিকেল কলেজ হাসপাতাল', slug: 'delta-medical', category: 'hospitals', description: 'মেডিকেল শিক্ষা ও চিকিৎসা গবেষণায় অগ্রণী হাসপাতাল।' },
  { name: 'পপুলার মেডিকেল কলেজ হাসপাতাল', slug: 'popular-medical', category: 'hospitals', description: 'সাশ্রয়ী ও মানসম্পন্ন স্বাস্থ্যসেবা প্রদানে অগ্রণী।' },
  { name: 'বিএমএস হাসপাতাল', slug: 'bms-hospital', category: 'hospitals', description: 'মাতৃ ও শিশু স্বাস্থ্যসেবায় বিশেষজ্ঞ হাসপাতাল।' },
  { name: 'গ্রিন লাইফ হাসপাতাল', slug: 'green-life-hospital', category: 'hospitals', description: 'কার্ডিওলজি ও অনকোলজি বিভাগে বিশেষজ্ঞ হাসপাতাল।' },
  { name: 'নর্দান ইন্টারন্যাশনাল মেডিকেল', slug: 'northern-international', category: 'hospitals', description: 'উত্তরায় অবস্থিত আধুনিক মাল্টি-স্পেশালটি হাসপাতাল।' },
  { name: 'কেয়ার মেডিকেল কলেজ', slug: 'care-medical', category: 'hospitals', description: 'অর্থোপেডিক ও নিউরো সার্জারিতে বিশেষজ্ঞ।' },
  { name: 'ঢাকা মেডিকেল কলেজ হাসপাতাল', slug: 'dmch', category: 'hospitals', description: 'বাংলাদেশের বৃহত্তম সরকারি হাসপাতাল ও মেডিকেল বিশ্ববিদ্যালয়।' },
  { name: 'বঙ্গবন্ধু মেডিকেল বিশ্ববিদ্যালয়', slug: 'bsmmu', category: 'hospitals', description: 'দেশের সর্বোচ্চ মেডিকেল বিশ্ববিদ্যালয় ও গবেষণা কেন্দ্র।' },
  { name: 'ন্যাশনাল হার্ট ফাউন্ডেশন', slug: 'nhf-dhaka', category: 'hospitals', description: 'হৃদরোগ চিকিৎসা ও গবেষণায় বিশেষজ্ঞ হাসপাতাল।' },
  { name: 'বার্ডেম হাসপাতাল', slug: 'birdem', category: 'hospitals', description: 'ডায়াবেটিস ও এন্ডোক্রাইন রোগ চিকিৎসায় বিশ্বখ্যাত।' },
  { name: 'সিএমএইচ ঢাকা', slug: 'cmh-dhaka', category: 'hospitals', description: 'সম্মিলিত সামরিক হাসপাতাল। সর্বাধুনিক চিকিৎসা সুবিধা।' },
  { name: 'হলি ফ্যামিলি রেড ক্রিসেন্ট', slug: 'holy-family-hospital', category: 'hospitals', description: 'মাতৃত্ব ও সামগ্রিক স্বাস্থ্যসেবায় বিখ্যাত হাসপাতাল।' },
  { name: 'কলম্বাস হাসপাতাল', slug: 'columbus-hospital', category: 'hospitals', description: 'নিউরোলজি ও নিউরোসার্জারিতে বিশেষজ্ঞ।' },
  { name: 'সলিমুল্লাহ মেডিকেল কলেজ', slug: 'smch-dhaka', category: 'hospitals', description: 'পুরান ঢাকার ঐতিহ্যবাহী সরকারি মেডিকেল কলেজ হাসপাতাল।' },
  { name: 'মুগদা মেডিকেল কলেজ', slug: 'mugda-medical', category: 'hospitals', description: 'পূর্ব ঢাকার নতুন সরকারি হাসপাতাল।' },
  { name: 'শহীদ সোহরাওয়ার্দী মেডিকেল', slug: 'ssmch', category: 'hospitals', description: 'মহাখালীতে অবস্থিত সরকারি মেডিকেল কলেজ হাসপাতাল।' },
  { name: 'নিপসম', slug: 'nipsom', category: 'hospitals', description: 'জনস্বাস্থ্য গবেষণা ও পেশাগত চিকিৎসায় বিশেষজ্ঞ।' },
  { name: 'মহাখালী কুষ্ঠ হাসপাতাল', slug: 'nlhd-dhaka', category: 'hospitals', description: 'চর্মরোগ ও কুষ্ঠরোগ চিকিৎসায় বিশেষজ্ঞ হাসপাতাল।' },
  { name: 'বাংলাদেশ সেনানিবাস হাসপাতাল', slug: 'cantonment-hospital', category: 'hospitals', description: 'সেনাবাহিনী পরিচালিত বিশেষায়িত হাসপাতাল।' },
  { name: 'মিরপুর জেনারেল হাসপাতাল', slug: 'mirpur-general', category: 'hospitals', description: 'মিরপুরে অবস্থিত সাশ্রয়ী মূল্যে চিকিৎসা সেবা।' },
  { name: 'ধানমন্ডি ক্লিনিক', slug: 'dhanmondi-clinic', category: 'hospitals', description: 'ধানমন্ডিতে বিশেষজ্ঞ চিকিৎসকদের ক্লিনিক।' },
  { name: 'গুলশান ক্লিনিক', slug: 'gulshan-clinic', category: 'hospitals', description: 'গুলশানে প্রিমিয়াম স্বাস্থ্যসেবা কেন্দ্র।' },
  { name: 'বনানী হাসপাতাল', slug: 'banani-hospital', category: 'hospitals', description: 'বনানীতে আধুনিক চিকিৎসা সুবিধাসম্পন্ন হাসপাতাল।' },
  { name: 'মোহাম্মদপুর ফার্টিলিটি', slug: 'mohammadpur-fertility', category: 'hospitals', description: 'বন্ধ্যাত্ব চিকিৎসা ও আইভিএফ বিশেষজ্ঞ ক্লিনিক।' },

  // Diagnostics (30)
  { name: 'ল্যাবএইড ডায়াগনস্টিক', slug: 'labaid-diagnostic', category: 'diagnostics', description: 'দেশের সবচেয়ে বড় ডায়াগনস্টিক চেইন। দ্রুত রিপোর্ট।' },
  { name: 'পপুলার ডায়াগনস্টিক সেন্টার', slug: 'popular-diagnostic', category: 'diagnostics', description: 'সারাদেশে ৫০+ শাখায় উন্নত ডায়াগনস্টিক সেবা।' },
  { name: 'ডায়াগনস্টিক সেন্টার ধানমন্ডি', slug: 'dc-dhanmondi', category: 'diagnostics', description: 'সব ধরনের প্যাথলজি ও ইমেজিং পরীক্ষা।' },
  { name: 'ইব্রাহিম মেডিকেল কলেজ ল্যাব', slug: 'imc-lab', category: 'diagnostics', description: 'বার্ডেম গ্রুপের অত্যাধুনিক ডায়াগনস্টিক ল্যাব।' },
  { name: 'মেডিনোভা মেডিকেল সার্ভিসেস', slug: 'medinova', category: 'diagnostics', description: 'বিশেষজ্ঞ চিকিৎসক পরামর্শ ও ডায়াগনস্টিক সেবা।' },
  { name: 'এক্সিওম ল্যাব', slug: 'axiom-lab', category: 'diagnostics', description: 'জিনগত পরীক্ষা ও মলিকুলার ডায়াগনস্টিকে বিশেষজ্ঞ।' },
  { name: 'বায়োমেড ল্যাব', slug: 'biomed-lab', category: 'diagnostics', description: 'আইএসও সার্টিফাইড ক্লিনিকাল ল্যাবরেটরি।' },
  { name: 'সিটি স্ক্যান সেন্টার ঢাকা', slug: 'ct-scan-dhaka', category: 'diagnostics', description: '৬৪-স্লাইস সিটি স্ক্যান ও এমআরআই সার্ভিস।' },
  { name: 'গ্রিন লাইফ ডায়াগনস্টিক', slug: 'greenlife-diagnostic', category: 'diagnostics', description: 'অনকোলজি বায়োমার্কার ও বিশেষ রক্ত পরীক্ষা।' },
  { name: 'কেয়ার ডায়াগনস্টিক সেন্টার', slug: 'care-diagnostic', category: 'diagnostics', description: 'নিউরোলজি ও কার্ডিওলজি বিশেষ পরীক্ষা।' },
  { name: 'এডভান্সড ডায়াগনস্টিক', slug: 'advanced-diagnostic', category: 'diagnostics', description: 'অত্যাধুনিক পিইটি স্ক্যান ও নিউক্লিয়ার মেডিসিন।' },
  { name: 'স্কয়ার ডায়াগনস্টিক', slug: 'square-diagnostic', category: 'diagnostics', description: 'স্কয়ার গ্রুপের ডায়াগনস্টিক সার্ভিস।' },
  { name: 'মডার্ন ডায়াগনস্টিক', slug: 'modern-diagnostic', category: 'diagnostics', description: 'আধুনিক যন্ত্রপাতিতে দ্রুত ও নির্ভুল পরীক্ষা।' },
  { name: 'ইউনিভার্সাল মেডিকেল কলেজ ল্যাব', slug: 'umc-lab', category: 'diagnostics', description: 'মহাখালী বিশ্ববিদ্যালয় হাসপাতালের ল্যাব সেবা।' },
  { name: 'ঢাকা ক্লিনিক্যাল ল্যাব', slug: 'dhaka-clinical-lab', category: 'diagnostics', description: 'স্বয়ংক্রিয় বিশ্লেষণে ত্রুটিমুক্ত রিপোর্ট।' },
  { name: 'আলোকিত ডায়াগনস্টিক', slug: 'alokito-diagnostic', category: 'diagnostics', description: 'সাশ্রয়ী মূল্যে সব ধরনের ডায়াগনস্টিক পরীক্ষা।' },
  { name: 'ঢাকা টেস্ট ল্যাব', slug: 'dhaka-test-lab', category: 'diagnostics', description: 'কোভিড-১৯ ও সংক্রামক রোগ পরীক্ষায় বিশেষজ্ঞ।' },
  { name: 'নর্দান ডায়াগনস্টিক', slug: 'northern-diagnostic', category: 'diagnostics', description: 'উত্তরায় সব ধরনের মেডিকেল পরীক্ষার সুবিধা।' },
  { name: 'গাজীপুর ডায়াগনস্টিক', slug: 'gazipur-diagnostic', category: 'diagnostics', description: 'গাজীপুরে সর্বাধুনিক ডায়াগনস্টিক সেবা।' },
  { name: 'নারায়ণগঞ্জ মেডিকেল ল্যাব', slug: 'narayanganj-lab', category: 'diagnostics', description: 'নারায়ণগঞ্জে সাশ্রয়ী মূল্যে ডায়াগনস্টিক পরীক্ষা।' },
  { name: 'এনাম ল্যাব', slug: 'enam-lab', category: 'diagnostics', description: 'সাভারে অবস্থিত সম্পূর্ণ ডায়াগনস্টিক সেন্টার।' },
  { name: 'হেলথ পয়েন্ট ডায়াগনস্টিক', slug: 'health-point-diagnostic', category: 'diagnostics', description: 'প্রিভেন্টিভ হেলথচেকআপ প্যাকেজে বিশেষজ্ঞ।' },
  { name: 'বায়োকেম ল্যাব', slug: 'biochem-lab', category: 'diagnostics', description: 'বায়োকেমিস্ট্রি ও হরমোন পরীক্ষায় বিশেষজ্ঞ।' },
  { name: 'এলাইড ডায়াগনস্টিক', slug: 'allied-diagnostic', category: 'diagnostics', description: 'ব্যাপক মেডিকেল চেকআপ প্যাকেজ সার্ভিস।' },
  { name: 'জাপান-বাংলাদেশ ল্যাব', slug: 'japan-bd-lab', category: 'diagnostics', description: 'জাপানি প্রযুক্তিতে উন্নত ডায়াগনস্টিক সার্ভিস।' },
  { name: 'মেট্রো ডায়াগনস্টিক', slug: 'metro-diagnostic', category: 'diagnostics', description: 'মেট্রোপলিটান এলাকায় দ্রুত ডায়াগনস্টিক সার্ভিস।' },
  { name: 'ডিএনএ সলিউশন বাংলাদেশ', slug: 'dna-solution-bd', category: 'diagnostics', description: 'ডিএনএ পরীক্ষা ও জেনেটিক কাউন্সেলিং সার্ভিস।' },
  { name: 'অ্যালার্জি ল্যাব বিডি', slug: 'allergy-lab-bd', category: 'diagnostics', description: 'অ্যালার্জি পরীক্ষা ও ইমিউনোলজি বিশেষজ্ঞ।' },
  { name: 'মেডিকেল সায়েন্স ল্যাব', slug: 'medical-science-lab', category: 'diagnostics', description: 'ক্লিনিকাল গবেষণা ও মেডিকেল পরীক্ষার সমন্বিত কেন্দ্র।' },
  { name: 'কিউর ডায়াগনস্টিক', slug: 'cure-diagnostic', category: 'diagnostics', description: 'অর্থোপেডিক ও রিউম্যাটোলজি বিশেষ পরীক্ষা।' },

  // Pharmacies (30)
  { name: 'স্বাস্থ্য সেবা ফার্মেসি', slug: 'shastho-sheba-pharmacy', category: 'pharmacies', description: 'সারাদেশে সুলভ মূল্যে ওষুধ সরবরাহকারী ফার্মেসি চেইন।' },
  { name: 'আরোগ্য ফার্মেসি', slug: 'arogya-pharmacy', category: 'pharmacies', description: 'জেনেরিক ও ব্র্যান্ড ওষুধের বিশ্বস্ত ফার্মেসি।' },
  { name: 'মেডিকেল স্টোর ঢাকা', slug: 'medical-store-dhaka', category: 'pharmacies', description: 'দুর্লভ ওষুধ ও বিশেষায়িত মেডিকেল সামগ্রীর ফার্মেসি।' },
  { name: 'অ্যাপোলো ফার্মেসি বিডি', slug: 'apollo-pharmacy-bd', category: 'pharmacies', description: 'আন্তর্জাতিক মানের ফার্মেসি চেইন।' },
  { name: 'জীবন ফার্মেসি', slug: 'jibon-pharmacy', category: 'pharmacies', description: 'সাশ্রয়ী মূল্যে মানসম্পন্ন ওষুধের নির্ভরযোগ্য ফার্মেসি।' },
  { name: 'ওষুধ ঘর', slug: 'oshudh-ghor', category: 'pharmacies', description: 'হোমিওপ্যাথিক ও আয়ুর্বেদিক ওষুধে বিশেষজ্ঞ।' },
  { name: 'নিরাময় ফার্মেসি', slug: 'niramoy-pharmacy', category: 'pharmacies', description: 'অনকোলজি ও বিশেষ ওষুধের নির্ভরযোগ্য সরবরাহকারী।' },
  { name: 'ড্রাগ ইন্টারন্যাশনাল শপ', slug: 'drug-international-shop', category: 'pharmacies', description: 'আমদানিকৃত ওষুধ ও মেডিকেল ডিভাইসের ফার্মেসি।' },
  { name: 'গণস্বাস্থ্য ফার্মেসি', slug: 'gonoshasthaya-pharmacy', category: 'pharmacies', description: 'জেনেরিক ওষুধে বিশেষজ্ঞ সাশ্রয়ী ফার্মেসি।' },
  { name: 'মেডিপ্লাস ফার্মেসি', slug: 'mediplus-pharmacy', category: 'pharmacies', description: 'সর্বাধুনিক ফার্মেসি ম্যানেজমেন্ট সিস্টেমে পরিচালিত।' },
  { name: 'ফার্মা প্লাস বিডি', slug: 'pharma-plus-bd', category: 'pharmacies', description: 'ওষুধের পাশাপাশি স্বাস্থ্য পরামর্শ সেবা।' },
  { name: 'বায়োকেম ফার্মেসি', slug: 'biochem-pharmacy', category: 'pharmacies', description: 'ভিটামিন ও সাপ্লিমেন্টে বিশেষজ্ঞ ফার্মেসি।' },
  { name: 'সিটি ফার্মেসি ঢাকা', slug: 'city-pharmacy-dhaka', category: 'pharmacies', description: 'শহরের কেন্দ্রে অবস্থিত সার্বক্ষণিক ফার্মেসি।' },
  { name: 'রাতের ফার্মেসি', slug: 'rater-pharmacy', category: 'pharmacies', description: '২৪ ঘণ্টা খোলা জরুরি ওষুধের ফার্মেসি।' },
  { name: 'হেলদি লাইফ ফার্মেসি', slug: 'healthy-life-pharmacy', category: 'pharmacies', description: 'অর্গানিক স্বাস্থ্য সম্পূরক ও প্রাকৃতিক ওষুধের ফার্মেসি।' },
  { name: 'সুস্থ থাকুন ফার্মেসি', slug: 'shustho-thakun', category: 'pharmacies', description: 'প্রতিরোধমূলক স্বাস্থ্যসেবা ও ওষুধের কেন্দ্র।' },
  { name: 'মিরপুর ফার্মেসি', slug: 'mirpur-pharmacy', category: 'pharmacies', description: 'মিরপুরে সব ধরনের ওষুধের সুলভ সরবরাহ।' },
  { name: 'বসুন্ধরা ফার্মেসি', slug: 'bashundhara-pharmacy', category: 'pharmacies', description: 'বসুন্ধরা সিটিতে অবস্থিত প্রিমিয়াম ফার্মেসি।' },
  { name: 'উত্তরা ফার্মেসি', slug: 'uttara-pharmacy', category: 'pharmacies', description: 'উত্তরায় সব বয়সের জন্য ওষুধ ও স্বাস্থ্যসেবা।' },
  { name: 'মতিঝিল ফার্মেসি', slug: 'motijheel-pharmacy', category: 'pharmacies', description: 'ব্যবসা কেন্দ্রে অবস্থিত দ্রুত সার্ভিসের ফার্মেসি।' },
  { name: 'পল্টন মেডিকেল স্টোর', slug: 'paltan-medical', category: 'pharmacies', description: 'পল্টনে সকল ধরনের মেডিকেল সরঞ্জাম ও ওষুধ।' },
  { name: 'গুলিস্তান ফার্মেসি', slug: 'gulistan-pharmacy', category: 'pharmacies', description: 'ব্যস্ত গুলিস্তান এলাকার বিশ্বস্ত ফার্মেসি।' },
  { name: 'যাত্রাবাড়ি মেডিসিন', slug: 'jatrabari-medicine', category: 'pharmacies', description: 'যাত্রাবাড়িতে সাশ্রয়ী মূল্যে ওষুধ সরবরাহ।' },
  { name: 'ডেমরা ফার্মেসি', slug: 'demra-pharmacy', category: 'pharmacies', description: 'ডেমরায় সব ধরনের ওষুধ ও স্বাস্থ্যসেবা।' },
  { name: 'কামরাঙ্গীরচর ওষুধ', slug: 'kamrangirchar-pharmacy', category: 'pharmacies', description: 'কামরাঙ্গীরচরে সুলভ মূল্যে ওষুধ সরবরাহ।' },
  { name: 'লালবাগ ফার্মেসি', slug: 'lalbagh-pharmacy', category: 'pharmacies', description: 'পুরান ঢাকার লালবাগে বিশ্বস্ত ফার্মেসি সেবা।' },
  { name: 'চকবাজার মেডিকেল', slug: 'chawkbazar-medical', category: 'pharmacies', description: 'চকবাজারে ঐতিহ্যবাহী হার্বাল ও আধুনিক ওষুধের কেন্দ্র।' },
  { name: 'নয়াবাজার ফার্মেসি', slug: 'nayabazar-pharmacy', category: 'pharmacies', description: 'নয়াবাজারে সব ধরনের ওষুধ ও মেডিকেল সামগ্রী।' },
  { name: 'বংশাল ওষুধ ঘর', slug: 'bangshal-pharmacy', category: 'pharmacies', description: 'বংশালে সাশ্রয়ী ও মানসম্পন্ন ওষুধ সেবা।' },
  { name: 'কোতোয়ালি ফার্মেসি', slug: 'kotwali-pharmacy', category: 'pharmacies', description: 'পুরান ঢাকার কোতোয়ালিতে বিশ্বস্ত ফার্মেসি।' },
];

// Sample reviews (realistic Bengali + English)
const REVIEW_TEMPLATES = [
  { rating: 5, body: 'অসাধারণ সেবা! সত্যিই খুব ভালো অভিজ্ঞতা হয়েছে। সবাইকে রিকমেন্ড করব।' },
  { rating: 5, body: 'দ্রুত ডেলিভারি এবং মানসম্পন্ন পণ্য। আবার অর্ডার করব ইনশাআল্লাহ।' },
  { rating: 4, body: 'সেবা ভালো ছিল। মাঝে মাঝে সামান্য দেরি হয়, কিন্তু সামগ্রিকভাবে সন্তুষ্ট।' },
  { rating: 4, body: 'ভালো মানের পণ্য পেয়েছি। দাম একটু বেশি মনে হয়েছে, তবে কোয়ালিটি ঠিক আছে।' },
  { rating: 3, body: 'মোটামুটি ঠিকঠাক। সেবার মান আরও উন্নত হলে ভালো হত।' },
  { rating: 5, body: 'Excellent service! Very professional and timely. Highly recommended.' },
  { rating: 4, body: 'Good overall experience. Staff was helpful and courteous.' },
  { rating: 3, body: 'Average service. Some improvements needed but acceptable.' },
  { rating: 5, body: 'স্টাফরা অনেক সহায়ক এবং ধৈর্যশীল। সেবায় খুব খুশি হয়েছি।' },
  { rating: 4, body: 'পণ্যের মান ভালো। কিন্তু ওয়েবসাইটে নেভিগেশন আরও সহজ হলে ভাল হতো।' },
];

async function main() {
  console.log('Seeding 200 launch businesses...');

  // Get district for Dhaka (use first Dhaka district)
  const dhakaDistrict = await prisma.district.findFirst({
    where: { nameEn: { contains: 'Dhaka' } },
  });
  if (!dhakaDistrict) throw new Error('Dhaka district not found — run db:seed first');

  // Get categories
  const categories = await prisma.category.findMany();
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  // Create a seed user for reviews
  const seedUser = await prisma.user.upsert({
    where: { phone: '+8801700000001' },
    create: { phone: '+8801700000001', displayName: 'আর্লি রিভিউয়ার ১', role: 'user', trustLevel: 3 },
    update: {},
  });
  const seedUser2 = await prisma.user.upsert({
    where: { phone: '+8801700000002' },
    create: { phone: '+8801700000002', displayName: 'বেটা টেস্টার', role: 'user', trustLevel: 2 },
    update: {},
  });
  const seedUser3 = await prisma.user.upsert({
    where: { phone: '+8801700000003' },
    create: { phone: '+8801700000003', displayName: 'Early Reviewer', role: 'user', trustLevel: 3 },
    update: {},
  });
  const reviewUsers = [seedUser, seedUser2, seedUser3];

  let created = 0;
  for (const biz of BUSINESSES) {
    const category = catBySlug[biz.category];
    if (!category) {
      console.warn(`Category not found: ${biz.category}`);
      continue;
    }

    // Create business (upsert by slug)
    const business = await prisma.business.upsert({
      where: { slug: biz.slug },
      create: {
        name: biz.name,
        slug: biz.slug,
        description: biz.description,
        categoryId: category.id,
        districtId: dhakaDistrict.id,
        isActive: true,
      },
      update: { description: biz.description },
    });

    // Add 3-5 reviews from seed users (skip if already reviewed)
    const reviewCount = 3 + Math.floor(Math.random() * 3); // 3-5
    const templates = [...REVIEW_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, reviewCount);

    let ratingSum = 0;
    let reviewsAdded = 0;
    for (let i = 0; i < templates.length; i++) {
      const tmpl = templates[i]!;
      const user = reviewUsers[i % reviewUsers.length]!;

      // Check if user already reviewed this business
      const existing = await prisma.review.findFirst({
        where: { businessId: business.id, userId: user.id },
      });
      if (existing) continue;

      await prisma.review.create({
        data: {
          businessId: business.id,
          userId: user.id,
          rating: tmpl.rating,
          body: tmpl.body,
          status: 'published',
        },
      });
      ratingSum += tmpl.rating;
      reviewsAdded++;
    }

    // Update business rating
    if (reviewsAdded > 0) {
      const globalAvg = 3.5;
      const minReviews = 10;
      const rawAvg = ratingSum / reviewsAdded;
      const bayesian = (minReviews * globalAvg + reviewsAdded * rawAvg) / (minReviews + reviewsAdded);
      await prisma.business.update({
        where: { id: business.id },
        data: {
          avgRating: parseFloat(bayesian.toFixed(2)),
          reviewCount: reviewsAdded,
          trustScore: parseFloat(bayesian.toFixed(4)),
        },
      });
    }

    created++;
    if (created % 20 === 0) console.log(`  Created ${created} businesses...`);
  }

  console.log(`Seeded ${created} businesses with reviews.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
