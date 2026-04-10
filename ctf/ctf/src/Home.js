import React, {useRef} from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() 
{
    const logo = ["images/logoCasaViva.png"]

    let x = 0;
    const titulo = useRef(null)
    const descricao = useRef(null)
    const senha = useRef(null)
    const chave = useRef(null)

    const flag = useRef()

    const navigate = useNavigate()

    const startCTF = () => {

        if(x === 0)
        {
            titulo.current.style.display = 'none';
            descricao.current.style.display = 'none';
            chave.current.style.display = 'none';

            senha.current.style.display = 'flex';

            x++;
        }
        else{
            titulo.current.style.display = 'block';
            descricao.current.style.display = 'block';
            chave.current.style.display = 'block';

            senha.current.style.display = 'none';

            x--;
        }
    }

    function verificar(event){
        if(event.key === 'Enter')
        {
            const valor = flag.current.value

            if(valor === "Começar"){
                navigate('/LvlOne')
            }
            else{
                alert("FLAG Incorreta!")
            }
        }
    }

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Redacted+Script&display=swap" rel="stylesheet" />

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: 'auto',
                height: '100vh',
                background: 'linear-gradient(135deg, #d3d0ff, #b0a8ff)',
                color: '#0033a0',
                textAlign: 'center',
                fontFamily: 'Arial, sans-serif',
                position: 'relative',
                zIndex: '0',
                }}>
                <img 
                    src={logo} 
                    alt="Inatel Cas@viva" 
                    onClick={startCTF}
                    style={{
                        position: 'absolute',
                        top: '-7vh',
                        left: '0vw',
                        width: '15vw',
                        height: 'auto',
                        cursor: 'pointer'
                    }} 
                />

                <div ref={chave} 
                    
                    style={{
                        position: 'absolute',
                        top: '2vh',
                        right: '3vw',
                        fontFamily: '"Redacted Script", cursive',
                        fontSize: '3rem',
                        color: '#0033a0',
                        cursor: 'default',
                    }}>
                    Começar</div>

                <div ref={senha} style={{
                    display: 'none',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    height: '100vh'
                }}>
                <h1 style={{
                    fontSize: '1.6rem',
                    lineHeight: '3',
                    color: 'black',
                    fontWeight: 'bold'
                }}>
                Digite a Senha para Iniciar
                </h1>
                
            <input 
            ref={flag} 
            onKeyDown={verificar} 
            type='text' 
            style={{
                borderRadius: '20px',
                backgroundColor: 'transparent',
                color: 'black',
                border: '2px solid black',
                paddingLeft: '10px',
                width: '35vw',
                height: '6vh',
                margin: '20px 0'
            }}>
            </input>

            <h2 style={{
                fontSize: '1.6rem',
                lineHeight: '3',
                color: 'black',
                fontWeight: 'bold'
            }}>
            A resposta está na página anterior
            </h2>
        </div>

                <div ref={titulo} style={{ alignItems: 'center', justifyContent: 'center', marginTop: '10vh', position: 'absolute'}}>
                  <h3 style={{ marginBottom: '2vh', fontWeight: 'bold', color: 'black' }}>Bem Vindos ao</h3>
                  <h1 style={{ fontSize: '4rem', marginBottom: '2vh' }}>
                      <span style={{ color: '#ff7f00' }}>C</span>apture 
                      <span style={{ color: '#ff7f00' }}> T</span>he 
                      <span style={{ color: '#ff7f00' }}> F</span>lag
                  </h1>
                  <h3 style={{ marginBottom: '20vh', fontWeight: 'bold', color: 'black' }}>do Inatel cas@viva</h3>
                </div>

                <p ref={descricao} style={{
                    maxWidth: '80vw',
                    fontSize: '1.5rem',
                    lineHeight: '1.5',
                    color: '#0033a0',
                    fontWeight: 'bold', 
                    marginTop: '70vh',
                }}>
                    Descubra as flags escondidas em cada desafio e avance para conquistar o título de mestre do CTF.  
                    Lembre-se: criatividade e atenção aos detalhes são suas melhores armas.
                </p>
            </div>
        </>
    );
}
