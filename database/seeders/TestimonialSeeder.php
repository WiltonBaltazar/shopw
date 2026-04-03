<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        $testimonials = [
            [
                'author_name'   => 'Ana M.',
                'author_detail' => 'Cliente desde 2023',
                'quote'         => 'Melhor cheesecake que já comi em Maputo! Perfeito para qualquer celebração.',
                'rating'        => 5,
                'is_active'     => true,
                'sort_order'    => 1,
            ],
            [
                'author_name'   => 'Carlos S.',
                'author_detail' => 'Maputo',
                'quote'         => 'Encomendei para o aniversário da minha filha e todos adoraram. Voltarei a encomendar!',
                'rating'        => 5,
                'is_active'     => true,
                'sort_order'    => 2,
            ],
            [
                'author_name'   => 'Fátima N.',
                'author_detail' => 'Matola',
                'quote'         => 'A opção sem lactose é incrível — não perco nada do sabor. Recomendo muito!',
                'rating'        => 5,
                'is_active'     => true,
                'sort_order'    => 3,
            ],
            [
                'author_name'   => 'João P.',
                'author_detail' => 'Maputo',
                'quote'         => 'Encomendei para um evento corporativo e foi um sucesso total. Entrega pontual e produto impecável.',
                'rating'        => 5,
                'is_active'     => true,
                'sort_order'    => 4,
            ],
            [
                'author_name'   => 'Sofia R.',
                'author_detail' => 'Cliente desde 2024',
                'quote'         => 'O cheesecake de morango é simplesmente divino. Já encomendei três vezes este mês!',
                'rating'        => 5,
                'is_active'     => true,
                'sort_order'    => 5,
            ],
            [
                'author_name'   => 'Miguel A.',
                'author_detail' => 'Matola',
                'quote'         => 'Qualidade artesanal que se nota logo no primeiro garfada. Presenteei a minha mãe e ela adorou.',
                'rating'        => 5,
                'is_active'     => true,
                'sort_order'    => 6,
            ],
        ];

        foreach ($testimonials as $data) {
            Testimonial::firstOrCreate(
                ['author_name' => $data['author_name'], 'quote' => $data['quote']],
                $data,
            );
        }
    }
}
