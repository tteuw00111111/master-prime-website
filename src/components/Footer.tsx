export default function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-6 text-center text-gray-400 text-sm">
        <div className="mb-6">
          <p className="font-bold text-gray-200">Master Prime</p>
          <p>CNPJ: [48076363000137]</p>
          <p>
            Endereço: [Avenida Cesário de Melo 2869 Loja 101 - Campo Grande]
          </p>
          <p>Telefone: [+55 (21) 967635340]</p>
        </div>

        <div className="max-w-3xl mx-auto mb-6">
          <p>
            Somos um centro de soluções em tecnologia independente. Não
            possuímos afiliação direta com as marcas mencionadas neste site. As
            marcas, nomes e logotipos aqui citados são de propriedade de seus
            respectivos detentores e são utilizados apenas para fins de
            referência.
          </p>
          <p className="mt-3">
            Atendemos de forma presencial/local. Não oferecemos suporte técnico
            remoto para softwares, aplicativos ou contas de terceiros (por
            exemplo: e-mail, redes sociais ou serviços on-line).
          </p>
        </div>

        <p>
          &copy; {new Date().getFullYear()} Master Prime. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}
