import { useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';

export default function CarouselCTF() 
{
    const images = [
        "/images/igrejaCTF.png",
        "/images/lagoCTF.png",
        "/images/quartoCTF.png",
        "/images/ceuCTF.png"
    ]
    const [current, setCurrent] = useState(0)

    const nextImage = () => setCurrent((prev) => (prev + 1) % images.length)
    const prevImage = () => setCurrent((prev) => (prev - 1 + images.length) % images.length)

    const navigate = useNavigate()

    const [flag, setFlag] = useState("")

    // --- zoom states ---
    const [zoomAberto, setZoomAberto] = useState(false)
    const [lupa, setLupa] = useState({ x: 0, y: 0, visible: false })
    const imgRef = useRef(null)

    function verificar(event){
        if(event.key === 'Enter')
        {
            if(flag === "GOGH"){
                navigate('/Second')
            }
            else{
                alert("FLAG Incorreta!")
            }
        }
    }

    function handleMouseMove(e) {
        const rect = imgRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const xPct = (x / rect.width) * 100
        const yPct = (y / rect.height) * 100
        setLupa({ x: xPct, y: yPct, visible: true })
    }

    function handleMouseLeave() {
        setLupa((prev) => ({ ...prev, visible: false }))
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-black">
            <h1 className="text-[1.5rem] mb-10 mt-[5vh] font-bold">A resposta está nas imagens!</h1>

            <div className="flex items-center justify-center gap-16 mb-10">
                <button 
                    onClick={prevImage}
                    className="text-black text-5xl cursor-pointer"
                >
                    &#10094;
                </button>

                <div className="relative w-full max-w-xl aspect-w-16 aspect-h-9">
                    <img 
                        src={images[current]} 
                        alt={`slide-${current}`} 
                        className="w-full max-h-[60vh] object-cover rounded cursor-zoom-in"
                        onClick={() => setZoomAberto(true)}
                    />
                </div>

                <button 
                    onClick={nextImage}
                    className="text-black text-5xl cursor-pointer"
                >
                    &#10095;
                </button>
            </div>

            <input 
                type="text" 
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                onKeyDown={verificar}
                className="w-[50vw] mb-[5vh] h-12 rounded-[20px] bg-transparent text-black border-2 border-black pl-[10px]"
            />

            {/* Overlay escuro */}
            {zoomAberto && (
                <div
                    className="fixed inset-0 bg-black z-40"
                    onClick={() => setZoomAberto(false)}
                />
            )}

            {/* Modal de zoom com lupa */}
            {zoomAberto && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-2">

                    {/* Botão X */}
                    <button
                        onClick={() => setZoomAberto(false)}
                        className="text-white text-2xl font-bold leading-none hover:text-gray-300"
                    >
                        ✕
                    </button>

                    {/* Container da imagem com efeito lupa */}
                    <div
                        className="relative overflow-hidden rounded-xl"
                        style={{ width: "80vw", maxWidth: "900px"}}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Imagem base */}
                        <img
                            ref={imgRef}
                            src={images[current]}
                            alt={`zoom-${current}`}
                            className="w-full max-h-[80vh] object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}

        </div>
    )
}