<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Business;
use App\Models\ServiceCategory;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. السوبر أدمن ──────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'superadmin@afrah.com'],
            [
                'name'     => 'سوبر أدمن',
                'password' => Hash::make('superadmin123'),
                'role'     => 'super_admin',
                'status'   => 'active',
            ]
        );

        // ── 2. المستخدم المدير ──────────────────────────────────────────────
        $user = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name'     => 'محمد الإدريسي',
                'password' => Hash::make('password'),
                'role'     => 'admin',
                'status'   => 'active',
            ]
        );

        // ── 3. المحل ────────────────────────────────────────────────────────
        $business = Business::firstOrCreate(
            ['admin_id' => $user->id],
            [
                'name'    => 'نور الأفراح',
                'phone'   => '0612345678',
                'address' => 'الدار البيضاء، المغرب',
                'status'  => 'active',
            ]
        );

        // ── 4. فئات الخدمات ─────────────────────────────────────────────────
        $categories = [
            'التصوير',
            'الديكور',
            'الضيافة',
            'الصوتيات',
            'التأجير',
        ];

        $createdCategories = [];
        foreach ($categories as $catName) {
            $createdCategories[$catName] = ServiceCategory::firstOrCreate([
                'business_id' => $business->id,
                'name'        => $catName,
            ]);
        }

        // ── 5. خدمات تجريبية ─────────────────────────────────────────────────
        $services = [
            [
                'name'        => 'تصوير احترافي',
                'category'    => 'التصوير',
                'description' => 'تصوير احترافي بكاميرا عالية الجودة مع معالجة الصور وتسليمها رقمياً',
                'price'       => 1500.00,
            ],
            [
                'name'        => 'تنسيق ديكور',
                'category'    => 'الديكور',
                'description' => 'تنسيق ديكورات القاعة حسب الطلب بأحدث التصاميم',
                'price'       => 2000.00,
            ],
            [
                'name'        => 'ضيافة بوفيه مفتوح',
                'category'    => 'الضيافة',
                'description' => 'تقديم وتنظيم بوفيه مفتوح بأصناف متعددة',
                'price'       => 1800.00,
            ],
            [
                'name'        => 'نظام صوت وإضاءة',
                'category'    => 'الصوتيات',
                'description' => 'تشغيل الموسيقى والأغاني وإضاءة احترافية',
                'price'       => 950.00,
            ],
            [
                'name'        => 'كيك الحفل',
                'category'    => 'الضيافة',
                'description' => 'تقديم وتجهيز الكيك بأنواع وتكهات متعددة',
                'price'       => 1200.00,
            ],
            [
                'name'        => 'تأجير خيمة مكيفة',
                'category'    => 'التأجير',
                'description' => 'تأجير خيمة مكيفة بمواصفات عالية الجودة',
                'price'       => 700.00,
            ],
            [
                'name'        => 'مشروبات ساخنة وباردة',
                'category'    => 'الضيافة',
                'description' => 'تقديم المشروبات الساخنة والباردة طوال الحفل',
                'price'       => 600.00,
            ],
        ];

        foreach ($services as $svcData) {
            $category = $createdCategories[$svcData['category']];
            Service::firstOrCreate(
                [
                    'business_id' => $business->id,
                    'name'        => $svcData['name'],
                ],
                [
                    'category_id' => $category->id,
                    'description' => $svcData['description'],
                    'price'       => $svcData['price'],
                ]
            );
        }

        $this->command->info('تم إنشاء البيانات التجريبية بنجاح');
    }
}