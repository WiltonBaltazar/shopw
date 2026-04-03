<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $this->upsertPage(
            'politica-de-privacidade',
            'Políticas de Privacidade',
            '<p>Descreva aqui como os dados dos clientes são recolhidos, tratados e protegidos.</p>'
        );

        $this->upsertPage(
            'politica-de-reembolso',
            'Política de devolução e reembolso',
            '<p>Descreva aqui as condições de devolução, cancelamento e reembolso.</p>'
        );

        $this->upsertPage(
            'termos-e-condicoes',
            'Termos e Condições',
            '<p>Descreva aqui os termos e condições de uso e compra no site.</p>'
        );
    }

    private function upsertPage(string $slug, string $title, string $defaultContent): void
    {
        $page = Page::firstOrNew(['slug' => $slug]);

        $page->title = $title;

        if (! $page->exists) {
            $page->content = $defaultContent;
            $page->is_published = true;
        }

        $page->save();
    }
}
