import { useState } from "react";
import { useNavigate } from 'react-router-dom';

export default function Home() 
{

    const navigate = useNavigate()

    const [flag, setFlag] = useState("")
    const [menuAberto, setMenuAberto] = useState(false)

    function verificar(event){
        if(event.key === 'Enter')
        {
            if(flag === "ultimato"){
                navigate('/Win')
            }
            else{
                alert("FLAG Incorreta!")
            }
        }
    }

    const codigo = `Durante a era das Guerras Gálicas, a comunicação era vital para as operações militares. Para manter a segurança de suas mensagens, os generais precisavam de um método seguro e confiável. Foi durante esse período que um método de comunicação secreta foi desenvolvido, permitindo que mensagens fossem transmitidas sem serem interceptadas pelos inimigos. Esse método envolvia uma técnica de substituição de caracteres, em que cada letra da mensagem original era trocada por outra letra seguindo uma regra pré-definida. Esse processo garantia que apenas as pessoas autorizadas tivessem acesso ao conteúdo das mensagens.

A técnica de substituição de caracteres foi amplamente utilizada pelos militares romanos, permitindo que trocassem informações importantes sem o risco de serem detectados. Os mensageiros, muitas vezes montados a cavalo, percorriam grandes distâncias carregando pergaminhos codificados. Caso fossem capturados por inimigos, o conteúdo das mensagens permaneceria incompreensível para aqueles que não conheciam o código.

Com o avançar das campanhas militares e a expansão do império, o sistema de codificação foi aprimorado. Alguns generais passaram a modificar a regra da substituição de tempos em tempos, tornando ainda mais difícil para os adversários decifrarem os escritos interceptados. Essa estratégia garantiu que apenas aqueles que possuíam a chave correta pudessem compreender as instruções enviadas pelo alto comando.

O uso desse método tornou-se um segredo guardado entre os oficiais de maior confiança. Em tendas de campanha, à luz de tochas, escribas dedicavam-se a converter mensagens comuns em códigos enigmáticos antes de enviá-las aos campos de batalha. Muitas decisões cruciais, desde ataques-surpresa até movimentações estratégicas, dependeram dessa forma de comunicação protegida.

Além da sua utilização em tempos de guerra, esse método de cifragem também serviu para proteger documentos administrativos e tratados secretos. Durante as negociações com povos aliados ou a espionagem contra inimigos, os romanos utilizavam essas mensagens codificadas para garantir que informações sigilosas não caíssem em mãos erradas. A confiabilidade desse sistema ajudou a consolidar a superioridade estratégica de Roma e manteve a segurança de seus planos militares por décadas.

Com a queda do Império Romano e o surgimento de novas civilizações, esse método não foi esquecido. Reis e comandantes medievais redescobriram a técnica, adaptando- a às suas necessidades. Durante a Idade Média, por exemplo, mensageiros transportavam correspondências sigilosas entre monarcas utilizando sistemas de substituição semelhantes. O mesmo ocorreu em tempos de grande exploração e conquista, quando navegadores e exércitos utilizavam códigos para proteger suas comunicações.

Ao longo da história, essa técnica de substituição inspirou outras formas de proteção de informações, dando origem a sistemas mais sofisticados de criptografia. O conceito de transformar mensagens comuns em algo indecifrado para aqueles que não possuíam a chave tornou-se a base para novas formas de segurança da informação. Mesmo nos dias atuais, o príncipio por trás dessa técnica ainda é aplicado em meios digitais para proteger dados pessoais, transações financeiras e comunicações sigilosas.

Assim, embora tenha surgido como uma necessidade militar em um período de grandes conflitos, esse método de cifragem tornou-se um marco importante na história da segurança da informação. O legado deixado pelos romanos continua influenciando a maneira como governos, empresas e indivíduos protegem seus dados e garantem a privacidade de suas comunicações. A capacidade de esconder e revelar informações, conforme necessário, permanece como um dos pilares fundamentais da estratégia e da segurança em tempos de paz e de guerra.

Durante a era das Guerras Gálicas, a comunicação era vital para as operações militares. Para manter a segurança de suas mensagens, os generais precisavam de um método seguro e confiável. Foi durante esse período que um método de comunicação secreta foi desenvolvido, permitindo que mensagens fossem transmitidas sem serem interceptadas pelos inimigos. Esse método envolvia uma técnica de substituição de caracteres, em que cada letra da mensagem original era trocada por outra letra seguindo uma regra pré-definida. Esse processo garantia que apenas as pessoas autorizadas tivessem acesso ao conteúdo das mensagens.

A técnica de substituição de caracteres foi amplamente utilizada pelos militares romanos, permitindo que trocassem informações importantes sem o risco de serem detectados. Os mensageiros, muitas vezes montados a cavalo, percorriam grandes distâncias carregando pergaminhos codificados. Caso fossem capturados por inimigos, o conteúdo das mensagens permaneceria incompreensível para aqueles que não conheciam o código.

Com o avançar das campanhas militares e a expansão do império, o sistema de codificação foi aprimorado. Alguns generais passaram a modificar a regra da substituição de tempos em tempos, tornando ainda mais difícil para os adversários decifrarem os escritos interceptados. Essa estratégia garantiu que apenas aqueles que possuíam a chave correta pudessem compreender as instruções enviadas pelo alto comando.

O uso desse método tornou-se um segredo guardado entre os oficiais de maior confiança. Em tendas de campanha, à luz de tochas, escribas dedicavam-se a converter mensagens comuns em códigos enigmáticos antes de enviá-las aos campos de batalha. Muitas decisões cruciais, desde ataques-surpresa até movimentações estratégicas, dependeram dessa forma de comunicação protegida. Além da sua utilização em tempos de guerra, esse método de cifragem também serviu para proteger documentos administrativos e tratados secretos. Durante as negociações com povos aliados ou a espionagem xowlpdwr contra inimigos, os romanos utilizavam essas mensagens codificadas para garantir que informações sigilosas não caíssem em mãos erradas. A confiabilidade desse sistema ajudou a consolidar a superioridade estratégica de Roma e manteve a segurança de seus planos militares por décadas.

Com a queda do Império Romano e o surgimento de novas civilizações, esse método não foi esquecido. Reis e comandantes medievais redescobriram a técnica, adaptando- a às suas necessidades. Durante a Idade Média, por exemplo, mensageiros transportavam correspondências sigilosas entre monarcas utilizando sistemas de substituição semelhantes. O mesmo ocorreu em tempos de grande exploração e conquista, quando navegadores e exércitos utilizavam códigos para proteger suas comunicações.`

    return (
    <>
       <div className="flex flex-col justify-center items-center h-screen relative">
            
            <h1 className="text-[1.8rem] leading-[1.5] text-black font-bold mb-[5vh]">
                Digite a FLAG para avançar
            </h1>

            <input
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                onKeyDown={verificar}
                className="rounded-[20px] bg-transparent text-black border-2 border-black pl-[10px] w-[30vw] h-[5vh]"
            />

            <div className="relative mt-3">
                <button
                    onClick={() => setMenuAberto(true)}
                    className="mt-[5vh] font-semibold text-[#ffffff] bg-[#ff7f00] rounded-[30px] px-20 py-3"
                >
                    Clique aqui
                </button>
            </div>

        </div>

        {/* Overlay escuro */}
        {menuAberto && (
            <div
                onClick={() => setMenuAberto(false)}
            />
        )}

        {/* Modal flutuante */}
        {menuAberto && (
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                
                {/* Header da aba */}
                <div className="flex items-center justify-between bg-gray-100 border-b border-gray-300 px-4 py-3">
                    <div className="flex items-center gap-2"></div>
                    <span className="text-sm text-black font-medium">Leia com atenção</span>
                    <button
                        onClick={() => setMenuAberto(false)}
                        className="text-gray-400 hover:text-gray-700 text-lg font-bold leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Conteúdo */}
                <p className="font-sans text-[15px] p-5 overflow-auto max-h-[70vh] text-justify whitespace-pre-wrap leading-relaxed">
                    {codigo}
                </p>

            </div>
        )}
    </>
    )
}