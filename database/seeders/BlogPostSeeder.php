<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class BlogPostSeeder extends Seeder
{
    public function run(): void
    {
        BlogPost::firstOrCreate(
            ['slug' => 'como-encomendar-cheesecake-artesanal-em-maputo'],
            [
                'title'        => 'Como encomendar cheesecake artesanal em Maputo',
                'excerpt'      => 'Descubra como é simples encomendar o seu cheesecake favorito em Maputo — escolha o sabor, personalize ao seu gosto e receba na sua porta em 24 horas.',
                'content'      => "Encomendar um cheesecake artesanal em Maputo nunca foi tão fácil. Na Cheesemania, o processo foi pensado para ser rápido, intuitivo e completamente online — sem filas, sem telefonemas.\n\nComeça por explorar o nosso menu. Temos cheesecakes clássicos como o New York Cheesecake, opções de frutos vermelhos, chocolate, maracujá e muito mais. Para quem tem intolerância à lactose, também temos versões sem lactose com o mesmo sabor incrível.\n\nDepois de escolher o seu favorito, basta indicar a data de entrega (com pelo menos 24 horas de antecedência), a sua morada em Maputo ou Matola, e finalizar a encomenda. Aceitamos pagamento via M-Pesa e dinheiro na entrega.\n\nA nossa equipa prepara o cheesecake fresco no dia da entrega, garantindo a máxima qualidade e frescura. Cada cheesecake é feito à mão com ingredientes selecionados, sem conservantes.\n\nPara eventos especiais como aniversários, casamentos ou festas corporativas, temos também opções de encomenda por evento com possibilidade de personalização e quantidades maiores. Basta preencher o formulário de evento no nosso site e entraremos em contacto.\n\nExperimente hoje e descubra porque somos a escolha favorita de mais de 200 clientes satisfeitos em Maputo e Matola.",
                'cover_image_url' => null,
                'is_published' => true,
                'published_at' => now(),
                'sort_order'   => 1,
            ],
        );
    }
}
