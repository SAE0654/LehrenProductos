import Head from 'next/head';
import { getSession, useSession } from "next-auth/react";
import styles from "../../styles/pages/ventas.module.scss";
import Layout from '../../components/Layout';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { isAnyFieldEmpty, sessionHasExpired } from '../../utils/forms';
import { Router, useRouter } from 'next/router';

export default function Producto() {
    const [Cursos, setCursos] = useState([]);
    const [Producto, setProducto] = useState({});
    // Función de cambios sin guardar
    const [notSaved, setNotSaved] = useState(false);
    const [OnChangeRoute, setOnChangeRoute] = useState(false);
    const [NextRoute, setNextRoute] = useState(null);
    const [GoToNext, setGoToNext] = useState(false);
    // Función de institución para opciones
    const [Institucion, setInstitucion] = useState(undefined);
    const Route = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        document.querySelector("body").className = '';
        document.querySelector("body").classList.add("registro_bg");
        sessionHasExpired();
    }, []);


    useEffect(() => {
        const beforeRouteHandler = (url) => {
            if (url === Route.asPath) return;
            setOnChangeRoute(true);
            setNextRoute(url);
            if (!GoToNext) {
                Router.events.emit('routeChangeError');
                throw "Operación cancelada";
            }
        };
        if (notSaved) {
            Router.events.on('routeChangeStart', beforeRouteHandler);
        } else {
            Router.events.off('routeChangeStart', beforeRouteHandler);
        }
        console.log("RECARGA")
        return () => {
            Router.events.off('routeChangeStart', beforeRouteHandler);
        };
    }, [notSaved, GoToNext]);


    const registerCourse = async (e) => {
        e.preventDefault();
        const producto = Producto;
        producto = { ...producto, creadoPor: session.user.names };
        producto = { ...producto, RVOE: producto.RVOE ? producto.RVOE : 'off' };
        console.log(producto)
        if (isAnyFieldEmpty(e.target)
            || producto.institucion === 'default'
            || typeof producto.institucion === 'undefined'
            || typeof producto.areaV === 'undefined') { // Si true, campos vacíos
            toast.error("Rellena todos los campos");
            return;
        }

        await axios.post(`https://lehren-productos.vercel.app/api/productos/all`, producto,
            {
                headers: {
                    accept: '*/*',
                    'Content-Type': 'application/json'
                }
            }).then((res) => {
                if (res.data.message) {
                    toast.info("Este producto ya existe");
                    return;
                }
                setCursos([...Cursos, res.data]);
                toast.success("Producto creado con éxito");
                setNotSaved(false);
                e.target.reset();
            }).catch(() => {
                toast.error("Falta información")
            });
    }

    const setProductoItem = (e) => {
        if (!notSaved) setNotSaved(true);
        if(e.target.name === 'institucion') {
            setInstitucion(e.target.value);
            Producto.areaV = undefined;
        }
        setProducto({
            ...Producto,
            [e.target.name]: e.target.value
        });
    }

    return <>
        <Head>
            <title>{!session ? 'Cargando...' : session.user.names} | Alta de producto </title>
            <meta name="description" content="Login app" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <Layout>
            <div className={OnChangeRoute ? "wrapper_bg" : "wrapper_bg hide"} aria-hidden="true"></div>
            <div className={OnChangeRoute ? "window_confirm" : "window_confirm hide"}>
                <h1 className="mini">¿Seguro que quieres salir? Perderás tu trabajo actual</h1>
                <div className="cancel_continue">
                    <button onClick={() => (setGoToNext(true), Route.push(NextRoute))}>Continuar</button>
                    <button onClick={() => setOnChangeRoute(false)}>Cancelar</button>
                </div>
            </div>
            <div className={styles.main_content}>
                <h1>Genera un producto</h1>
                <div className={styles.box_container}>

                    <form onSubmit={(e) => registerCourse(e)}>
                        <div className={styles.form_group}>
                            <h2>Datos generales</h2>
                            <input
                                type="text"
                                name="nombre"
                                placeholder="Propuesta del nombre del producto"
                                onChange={(e) => setProductoItem(e)} />
                            <div className="radio_ck_section">
                                <h3>Tipo de oferta</h3>
                                <label className="control control-radio">
                                    Diplomado
                                    <input type="radio" name="tipo" value="diplomado" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                                <label className="control control-radio">
                                    Especialidad
                                    <input type="radio" name="tipo" value="especialidad" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                                <label className="control control-radio">
                                    Licenciatura
                                    <input type="radio" name="tipo" value="licenciatura" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                                <label className="control control-radio">
                                    Maestría
                                    <input type="radio" name="tipo" value="maestria" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                                <label className="control control-radio">
                                    Taller
                                    <input type="radio" name="tipo" value="taller" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                                <label className="control control-radio">
                                    Curso
                                    <input type="radio" name="tipo" value="curso" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                            </div>
                            <div className="radio_ck_section">
                                <h3>Modalidad de oferta</h3>
                                <label className="control control-radio">
                                    Presencial
                                    <input type="radio" name="modalidad" value="presencial" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                                <label className="control control-radio">
                                    Mixto
                                    <input type="radio" name="modalidad" value="mixto" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                                <label className="control control-radio">
                                    En línea asincrónico
                                    <input type="radio" name="modalidad" value="lineaAsync" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                                <label className="control control-radio">
                                    En línea sincrónico
                                    <input type="radio" name="modalidad" value="lineaSync" onChange={(e) => setProductoItem(e)} />
                                    <div className="control_indicator"></div>
                                </label>
                            </div>
                            <select name="institucion" id="institucion" onChange={(e) => setProductoItem(e)} >
                                <option value="default">Selecciona una institución</option>
                                <option value="sae">SAE</option>
                                <option value="artek">Artek</option>
                            </select>
                            {
                               Institucion === 'default' || typeof Institucion === 'undefined' ? null :
                                    <>
                                        <div className="radio_ck_section" style={Institucion === 'sae' ? { display: 'block' } : { display: 'none' }}>
                                            <h3>Área a la que se víncula</h3>
                                            <label className="control control-radio">
                                                Cine digital
                                                <input type="radio" name="areaV" value="cinedigital" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Animación y efectos visuales
                                                <input type="radio" name="areaV" value="animacionefectos" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Comunicación
                                                <input type="radio" name="areaV" value="comunicacion" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Diseño de videojuegos
                                                <input type="radio" name="areaV" value="videojuegosD" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Ingeniería de audio
                                                <input type="radio" name="areaV" value="audio" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Negocios de la música
                                                <input type="radio" name="areaV" value="musicB" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Programación de videojuegos
                                                <input type="radio" name="areaV" value="videojuegosP" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                        </div>
                                        <div className="radio_ck_section" style={Institucion === 'artek' ? { display: 'block' } : { display: 'none' }}>
                                            <h3>Área a la que se víncula</h3>
                                            <label className="control control-radio">
                                                Gestión Tecnológica
                                                <input type="radio" name="areaV" value="gestionTech" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Desarrollo de Software
                                                <input type="radio" name="areaV" value="softwareDev" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Ciencia de Datos
                                                <input type="radio" name="areaV" value="dataScience" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Ciberseguridad
                                                <input type="radio" name="areaV" value="cyberSec" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                            <label className="control control-radio">
                                                Inteligencia Artificial
                                                <input type="radio" name="areaV" value="IA" onChange={(e) => setProductoItem(e)} />
                                                <div className="control_indicator"></div>
                                            </label>
                                        </div>
                                    </>
                            }
                        </div>
                        <div className={styles.form_group}>
                            <h2>Descripción general</h2>
                            <input
                                type="text"
                                name="quienPropone"
                                placeholder="Persona o área que propone el producto"
                                onChange={(e) => setProductoItem(e)} />
                            <textarea name="razon" maxLength="500" placeholder='Razón o necesidad de la propuesta' onChange={(e) => setProductoItem(e)}></textarea>
                            <input type="text" name="poblacionObj" placeholder="A quién va dirigido" onChange={(e) => setProductoItem(e)} />
                            <textarea name="descripcion" maxLength="500" placeholder="Descripción general" onChange={(e) => setProductoItem(e)}></textarea>
                            <div className={styles.container_footer}>
                                <label className={styles.form_control}>
                                    <input type="checkbox" name="RVOE" id="RVOE" onChange={(e) => setProductoItem(e)} />
                                    RVOE
                                </label>
                                <input type="submit" value="Registrar producto" />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    </>
}

export async function getServerSideProps(ctx) {
    const _session = await getSession(ctx);

    if (!_session) return {
        redirect: {
            destination: '/',
            permanent: false
        }
    }

    return {
        props: {
        }
    }
}
