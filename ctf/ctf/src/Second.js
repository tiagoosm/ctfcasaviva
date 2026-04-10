import { useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';

export default function Home() 
{
    const imagem1 = "images/Fogo.webp"
    const imagem2 = "images/Cachorro.jpg"
    const imagem3 = "images/Estrelas.jpeg"
    const imagem4 = "images/Desenho.jpg"
    const imagem5 = "images/Bolinha.jpg"
    const imagem6 = "images/Arvore.jpg"

    const navigate = useNavigate()

    const [hidden, setHidden] = useState([]);
    const [ordemClicada, setOrdemClicada] = useState([]);

    const ordemCorreta = [6, 5, 2, 4, 3, 1];

    function toggleImage(id)
    {
        if (hidden.includes(id)) return;

        setHidden([...hidden, id]);

        const novaOrdem = [...ordemClicada, id];
        setOrdemClicada(novaOrdem);

        if (novaOrdem.length === 6)
        {
            const acertou = JSON.stringify(novaOrdem) === JSON.stringify(ordemCorreta);

            setTimeout(() => {
                if (acertou)
                {
                    navigate('/Final');
                }
                else
                {
                    alert("Errado! Tente novamente!");
                }

                setHidden([]);
                setOrdemClicada([]);
            }, 400);
        }
    }

    return (
        <>
            <div className="flex flex-col justify-center items-center min-h-screen gap-10">

                <div className="grid grid-cols-3 gap-x-[100px] gap-y-[150px]">
                    
                    <div className="w-[15vw] h-[15vh] flex justify-center items-center cursor-pointer"
                        onClick={() => toggleImage(1)}>
                        <img src={imagem1} className={hidden.includes(1) ? "hidden" : ""} />
                    </div>

                    <div className="w-[15vw] h-[15vh] flex justify-center items-center cursor-pointer"
                        onClick={() => toggleImage(2)}>
                        <img src={imagem2} className={hidden.includes(2) ? "hidden" : ""} />
                    </div>

                    <div className="w-[15vw] h-[15vh] flex justify-center items-center cursor-pointer"
                        onClick={() => toggleImage(3)}>
                        <img src={imagem3} className={hidden.includes(3) ? "hidden" : ""} />
                    </div>

                    <div className="w-[15vw] h-[15vh] flex justify-center items-center cursor-pointer"
                        onClick={() => toggleImage(4)}>
                        <img src={imagem4} className={hidden.includes(4) ? "hidden" : ""} />
                    </div>

                    <div className="w-[15vw] h-[15vh] flex justify-center items-center cursor-pointer"
                        onClick={() => toggleImage(5)}>
                        <img src={imagem5} className={hidden.includes(5) ? "hidden" : ""} />
                    </div>

                    <div className="w-[15vw] h-[15vh] flex justify-center items-center cursor-pointer"
                        onClick={() => toggleImage(6)}>
                        <img src={imagem6} className={hidden.includes(6) ? "hidden" : ""} />
                    </div>

                </div>

            </div>
        </>
    );
}