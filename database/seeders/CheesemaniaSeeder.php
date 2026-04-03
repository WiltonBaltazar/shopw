<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductAddon;
use App\Models\ProductAttribute;
use App\Models\ProductAttributeValue;
use App\Models\ProductVariant;
use App\Models\OptionRule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CheesemaniaSeeder extends Seeder
{
    public function run(): void
    {
        // ── Truncate in dependency order ──────────────
        DB::statement('PRAGMA foreign_keys = OFF');
        DB::table('option_rules')->delete();
        DB::table('variant_attribute_values')->delete();
        DB::table('order_item_addons')->delete();
        DB::table('order_items')->delete();
        DB::table('mpesa_transactions')->delete();
        DB::table('orders')->delete();
        DB::table('product_variants')->delete();
        DB::table('product_attribute_values')->delete();
        DB::table('product_attributes')->delete();
        DB::table('product_addons')->delete();
        DB::table('product_images')->delete();
        DB::table('products')->delete();
        DB::table('categories')->delete();
        DB::statement('PRAGMA foreign_keys = ON');

        // ── Admin user ────────────────────────────────
        User::updateOrCreate(
            ['email' => 'admin@cheesemania.com'],
            ['name' => 'Admin', 'password' => Hash::make('password'), 'is_admin' => true]
        );

        // ── Categories ───────────────────────────────
        $classic = Category::create(['name' => 'Clássicos',  'slug' => 'classicos',  'sort_order' => 1]);
        $special = Category::create(['name' => 'Especiais',  'slug' => 'especiais',  'sort_order' => 2]);
        $mini    = Category::create(['name' => 'Mini',       'slug' => 'mini',       'sort_order' => 3]);
        $tiered  = Category::create(['name' => 'Tiered',     'slug' => 'tiered',     'sort_order' => 4]);

        // ── Products ─────────────────────────────────
        // Prices stored in cents (MT × 100). e.g. 800 MT = 80000

        // 1. New York Cheesecake
        // Sizes: 10cm=800, 15cm=1650, 18cm=2500, 24cm=3000, 26cm=3800 MT
        $p = $this->product('New York Cheesecake', 'new-york-cheesecake', $classic->id, 1,
            'O clássico New York Cheesecake, cremoso e irresistível.',
            ['https://cheesemaniaa.com/wp-content/uploads/2023/12/New-York-Cheesecake.webp',
             'https://cheesemaniaa.com/wp-content/uploads/2023/12/New-York-2.webp']
        );
        $this->sizeAttrVariants($p, [
            '10 cm' => 800,
            '15 cm' => 1650,
            '18 cm' => 2500,
            '24 cm' => 3000,
            '26 cm' => 3800,
        ]);
        $this->saborAddon($p, ['Chocolate & Oreo', 'Floresta Negra', 'Frutos Vermelhos', 'Limão', 'Lotus', 'Maracujá', 'Oreo', 'Pina Colada', 'Pistachio']);

        // 2. Non Baked Cheesecake
        // Sizes: 10cm=500, 15cm=1400, 18cm=1900, 24cm=2700, 26cm=3300 MT
        $p = $this->product('Non Baked Cheesecake', 'non-baked-cheesecake', $classic->id, 2,
            'Cheesecake sem cozedura, leve e refrescante.',
            ['https://cheesemaniaa.com/wp-content/uploads/2023/12/IMG_0886-2.jpg',
             'https://cheesemaniaa.com/wp-content/uploads/2023/12/minis.jpg',
             'https://cheesemaniaa.com/wp-content/uploads/2024/12/Cheesemania-Non-Baked.webp']
        );
        $this->sizeAttrVariants($p, [
            '10 cm' => 500,
            '15 cm' => 1400,
            '18 cm' => 1900,
            '24 cm' => 2700,
            '26 cm' => 3300,
        ]);
        $this->saborAddon($p, ['Café', 'Chocolate & Oreo', 'Frutos Vermelhos', 'Limão', 'Lotus', 'Maracujá', 'Oreo', 'Pistachio']);

        // 3. Burnt Basque Cheesecake
        // Sizes: 10cm=850, 15cm=1650, 18cm=2000, 24cm=2800, 26cm=3800 MT
        $p = $this->product('Burnt Basque Cheesecake', 'burnt-basque-cheesecake', $classic->id, 3,
            'O famoso Burnt Basque, com exterior caramelizado e interior cremoso.',
            ['https://cheesemaniaa.com/wp-content/uploads/2023/12/Burnt-1-1.webp',
             'https://cheesemaniaa.com/wp-content/uploads/2023/12/Burn-3.webp',
             'https://cheesemaniaa.com/wp-content/uploads/2024/12/Burnt-Cheesecake.webp']
        );
        $this->sizeAttrVariants($p, [
            '10 cm' => 850,
            '15 cm' => 1650,
            '18 cm' => 2000,
            '24 cm' => 2800,
            '26 cm' => 3800,
        ]);
        $this->saborAddon($p, ['Chocolate & Oreo', 'Frutos Vermelhos', 'Limão', 'Lotus', 'Maracujá', 'Oreo', 'Pistachio']);

        // 4. Fatia do Dia (simple product — fixed price, no variant selection)
        $p = Product::create([
            'name' => 'Fatia do Dia', 'slug' => 'fatia-do-dia', 'category_id' => $classic->id,
            'product_type' => 'simple',
            'description' => 'Uma fatia generosa do cheesecake do dia. Sabor sujeito a disponibilidade — pergunte-nos qual é o sabor de hoje!',
            'requires_advance_order' => false,
            'is_active' => true, 'sort_order' => 4,
        ]);
        $p->images()->create(['path' => 'https://cheesemaniaa.com/wp-content/uploads/2023/12/New-York-2.webp', 'alt' => 'Fatia do Dia', 'is_primary' => true, 'sort_order' => 0]);
        ProductVariant::create(['product_id' => $p->id, 'price' => 250, 'is_available' => true]);

        // 5. Red Velvet Cheesecake
        // Sizes: 15cm=1650, 18cm=2500, 24cm=3000 MT
        $p = $this->product('Red Velvet Cheesecake', 'red-velvet-cheesecake', $special->id, 4,
            "O deslumbrante Red Velvet Cheesecake.\n\n10 cm – 2 Pessoas | 15 cm – 4/5 Pessoas | 18 cm – 10/12 Pessoas | 24 cm – 16/20 Pessoas",
            ['https://cheesemaniaa.com/wp-content/uploads/2023/12/2.jpg',
             'https://cheesemaniaa.com/wp-content/uploads/2023/12/Artboard-1.webp',
             'https://cheesemaniaa.com/wp-content/uploads/2023/12/Red-Velvet-Fatia.webp']
        );
        $this->sizeAttrVariants($p, [
            '15 cm' => 1650,
            '18 cm' => 2500,
            '24 cm' => 3000,
        ]);

        // 5. Cheesecake Japonês
        // Sizes: 10cm=900, 15cm=1800, 20cm=2200 MT
        $p = $this->product('Cheesecake Japonês', 'cheesecake-japones', $special->id, 5,
            'O suave e fofo Cheesecake Japonês, derrete na boca.',
            ['https://cheesemaniaa.com/wp-content/uploads/2025/05/Cheesecake-Japones-02.jpg',
             'https://cheesemaniaa.com/wp-content/uploads/2025/05/Cheesecake-Japones-15.jpg',
             'https://cheesemaniaa.com/wp-content/uploads/2025/05/Cheesecake-Japones-01.jpg']
        );
        $this->sizeAttrVariants($p, [
            '10 cm' => 900,
            '15 cm' => 1800,
            '20 cm' => 2200,
        ]);

        // 6. Cheesecake Personalizado
        // Sizes: 10cm=650, 18cm=2200, 24cm=2900 MT
        $p = $this->product('Cheesecake Personalizado', 'cheesecake-personalizado', $special->id, 6,
            'Crie o seu cheesecake perfeito. Escolha o tamanho, a personalização e os sabores.',
            ['https://cheesemaniaa.com/wp-content/uploads/2023/12/Cheesemania-2.webp',
             'https://cheesemaniaa.com/wp-content/uploads/2023/12/Cheesecake-Personalizado.webp',
             'https://cheesemaniaa.com/wp-content/uploads/2023/12/Lotus.webp']
        );
        // Tamanho attribute
        $attrTam = ProductAttribute::create(['product_id' => $p->id, 'name' => 'Tamanho', 'sort_order' => 0]);
        $sizes = [];
        foreach (['10 cm' => 650, '18 cm' => 2200, '24 cm' => 2900] as $size => $price) {
            $sizes[$size] = ['val' => ProductAttributeValue::create(['attribute_id' => $attrTam->id, 'value' => $size, 'sort_order' => count($sizes)]), 'price' => $price];
        }

        // Personalização attribute
        $attrPers = ProductAttribute::create(['product_id' => $p->id, 'name' => 'Personalização', 'sort_order' => 1]);
        $persVals = [];
        foreach (['1 em 1', '2 em 1', '3 em 1', '4 em 1'] as $i => $v) {
            $persVals[$v] = ProductAttributeValue::create(['attribute_id' => $attrPers->id, 'value' => $v, 'sort_order' => $i]);
        }

        // Cross-product variants: Tamanho × Personalização
        // "4 em 1" only available for 24 cm
        foreach ($sizes as $sizeName => $sizeData) {
            foreach ($persVals as $persName => $persVal) {
                if ($persName === '4 em 1' && $sizeName !== '24 cm') continue;
                $variant = ProductVariant::create(['product_id' => $p->id, 'price' => $sizeData['price'], 'is_available' => true]);
                $variant->attributeValues()->attach([$sizeData['val']->id, $persVal->id]);
            }
        }

        // Option rules: disable "4 em 1" when 10cm or 18cm is selected
        foreach (['10 cm', '18 cm'] as $sizeName) {
            OptionRule::create([
                'product_id' => $p->id,
                'condition_value_id' => $sizes[$sizeName]['val']->id,
                'target_value_id' => $persVals['4 em 1']->id,
                'rule_type' => 'disable',
            ]);
        }

        // Sabor attribute (non-variant, multi-select driven by Personalização count)
        $attrSabor = ProductAttribute::create(['product_id' => $p->id, 'name' => 'Sabor', 'sort_order' => 2]);
        foreach (['Frutos Vermelhos', 'Caramelo Salgado', 'Maracujá', 'Limão', 'Lotus', 'Oreo & Chocolate', 'Oreo'] as $i => $v) {
            ProductAttributeValue::create(['attribute_id' => $attrSabor->id, 'value' => $v, 'sort_order' => $i]);
        }
        ProductAddon::create(['product_id' => $p->id, 'name' => 'Topper — Happy Birthday', 'price' => 150, 'type' => 'checkbox', 'sort_order' => 0]);
        ProductAddon::create(['product_id' => $p->id, 'name' => 'Mensagem', 'price' => 0, 'type' => 'text', 'placeholder' => 'Escreva a sua mensagem...', 'sort_order' => 1]);

        // 7. Mini Cheesecakes
        // Sizes: 4un=600, Meia Dúzia=825, Dúzia=1700, 24un=2500 MT
        $p = $this->product('Mini Cheesecakes', 'mini-cheesecakes', $mini->id, 7,
            'Mini cheesecakes individuais, perfeitos para festas e eventos.',
            ['https://cheesemaniaa.com/wp-content/uploads/2025/04/Mini-Cheesecakes.webp',
             'https://cheesemaniaa.com/wp-content/uploads/2025/04/Mini-2.jpg',
             'https://cheesemaniaa.com/wp-content/uploads/2025/04/Mini-5.webp',
             'https://cheesemaniaa.com/wp-content/uploads/2025/04/Mini-3.webp']
        );
        $this->sizeAttrVariants($p, [
            '4 Unidades'  =>  600,
            'Meia Dúzia'  =>  825,
            'Dúzia'       => 1700,
            '24 Unidades' => 2500,
        ], 'Quantidade');
        // Tipo and Personalização are display-only selectors (no price impact)
        $attrTipo = ProductAttribute::create(['product_id' => $p->id, 'name' => 'Tipo', 'sort_order' => 1]);
        foreach (['Non-Baked', 'New York'] as $i => $v) {
            ProductAttributeValue::create(['attribute_id' => $attrTipo->id, 'value' => $v, 'sort_order' => $i]);
        }
        $attrPers = ProductAttribute::create(['product_id' => $p->id, 'name' => 'Personalização', 'sort_order' => 2]);
        foreach (['1 Sabor', '2 Sabores', '3 Sabores', '4 Sabores'] as $i => $v) {
            ProductAttributeValue::create(['attribute_id' => $attrPers->id, 'value' => $v, 'sort_order' => $i]);
        }
        $attrSabor = ProductAttribute::create(['product_id' => $p->id, 'name' => 'Sabor', 'sort_order' => 3]);
        foreach (['Frutos Vermelhos', 'Caramelo Salgado', 'Maracujá', 'Limão', 'Lotus', 'Oreo & Chocolate', 'Oreo'] as $i => $v) {
            ProductAttributeValue::create(['attribute_id' => $attrSabor->id, 'value' => $v, 'sort_order' => $i]);
        }

        // 8. Tiered Cheesecake
        // 2 Camadas Pequena=3850, 2 Camadas Grande=5100, 3 Camadas=7000, 4 Camadas=9350 MT
        $p = $this->product('Tiered Cheesecake', 'tiered-cheesecake', $tiered->id, 8,
            'Cheesecake em andares para grandes celebrações.',
            ['https://cheesemaniaa.com/wp-content/uploads/2023/12/Tiered-2.webp',
             'https://cheesemaniaa.com/wp-content/uploads/2023/12/Tiered.webp']
        );
        $this->sizeAttrVariants($p, [
            '2 Camadas Pequena (18+15cm)'       =>  3850,
            '2 Camadas Grande (24+18cm)'         =>  5100,
            '3 Camadas (24+18+10cm)'             =>  7000,
            '4 Camadas (26+24+18+10cm)'          =>  9350,
        ], 'Camadas');
        $this->saborAddon($p, ['Chocolate & Oreo', 'Frutos Vermelhos', 'Limão', 'Lotus', 'Maracujá', 'Oreo', 'Red Velvet']);
        ProductAddon::create(['product_id' => $p->id, 'name' => 'Notas (sabores por andar)', 'price' => 0, 'type' => 'text', 'placeholder' => 'Ex: Andar 1: Oreo, Andar 2: Limão...', 'sort_order' => 2]);
    }

    // ── Helpers ───────────────────────────────────────────────

    private function product(string $name, string $slug, int $categoryId, int $sort, string $desc, array $images): Product
    {
        $p = Product::create([
            'name' => $name, 'slug' => $slug, 'category_id' => $categoryId,
            'description' => $desc, 'requires_advance_order' => true,
            'is_active' => true, 'sort_order' => $sort,
        ]);
        foreach ($images as $i => $url) {
            $p->images()->create(['path' => $url, 'alt' => $name, 'is_primary' => $i === 0, 'sort_order' => $i]);
        }
        return $p;
    }

    private function sizeAttrVariants(Product $p, array $sizePrices, string $attrName = 'Tamanho'): void
    {
        $attr = ProductAttribute::create(['product_id' => $p->id, 'name' => $attrName, 'sort_order' => 0]);
        $i = 0;
        foreach ($sizePrices as $size => $price) {
            $val     = ProductAttributeValue::create(['attribute_id' => $attr->id, 'value' => $size, 'sort_order' => $i++]);
            $variant = ProductVariant::create(['product_id' => $p->id, 'price' => $price, 'is_available' => true]);
            $variant->attributeValues()->attach([$val->id]);
        }
    }

    private function saborAddon(Product $p, array $flavours): void
    {
        ProductAddon::create([
            'product_id'  => $p->id,
            'name'        => 'Sabor',
            'price'       => 0,
            'type'        => 'select',
            'placeholder' => 'Escolha o sabor',
            'sort_order'  => 0,
            'options'     => $flavours,
        ]);
    }
}
