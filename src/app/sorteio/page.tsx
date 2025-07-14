'use client';
import Raspadinha from "../components/Raspadinha";



export default function Sorteio() {
    return (
        <>
            <div>
                <h1 style={{ textAlign: 'center' }}>Raspadinha</h1>
                <Raspadinha
                    width={300}
                    height={300}
                    backgroundImage="/result.png"
                    overlayColor="#a4a4a4"
                    onComplete={() => alert('🎉 Você raspou o suficiente!')}
                >
                    {/* <p style={{ fontSize: 20 }}>Você Ganhou!</p> */}
                </Raspadinha>
            </div>
        </>
    )
}