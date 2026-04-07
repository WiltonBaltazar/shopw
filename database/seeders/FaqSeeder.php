<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            [
                'question'   => 'Fazem entrega de cheesecake em Maputo?',
                'answer'     => 'Sim, entregamos cheesecakes Homemade em toda a cidade de Maputo e Matola. As encomendas devem ser feitas com pelo menos 24 horas de antecedência.',
                'is_active'  => true,
                'sort_order' => 1,
            ],
            [
                'question'   => 'Como encomendar cheesecake em Maputo?',
                'answer'     => 'Pode encomendar online no nosso site, escolher o seu cheesecake favorito e finalizar a encomenda. Aceitamos pagamento via M-Pesa.',
                'is_active'  => true,
                'sort_order' => 2,
            ],
            [
                'question'   => 'Têm cheesecakes sem lactose em Maputo?',
                'answer'     => 'Sim, temos cheesecakes sem lactose e opções fitness disponíveis. Todos os nossos produtos são feitos à mão em Maputo.',
                'is_active'  => true,
                'sort_order' => 3,
            ],
            [
                'question'   => 'Aceitam pagamento via M-Pesa?',
                'answer'     => 'Sim, aceitamos pagamento via M-Pesa e dinheiro na entrega.',
                'is_active'  => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($faqs as $data) {
            Faq::firstOrCreate(
                ['question' => $data['question']],
                $data,
            );
        }
    }
}
