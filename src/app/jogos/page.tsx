import Link from "next/link";

export default function JogosPage() {
    return (
        <div>
            <h1>Página de Jogos</h1>
            <p>Bem-vindo à seção de jogos!</p>
            <Link href="/jogos/caixa">Jogar Caixa Surpresa</Link><br />
        </div>
    );
}