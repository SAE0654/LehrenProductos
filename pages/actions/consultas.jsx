import Head from 'next/head';
import styles from "../../styles/pages/ventas.module.scss";
import { getSession, useSession } from "next-auth/react";
import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { AiOutlineClose, AiTwotoneEdit, AiOutlineEye, AiFillDelete, AiOutlineSave } from 'react-icons/ai';
import { BsSearch } from "react-icons/bs";
import { toast } from 'react-toastify';
import { getTimeStamp, sessionHasExpired } from '../../utils/forms';
import { NavLink } from '../../components/NavLink';
import { Router, useRouter } from 'next/router';

export default function Consultas() {
    const [Productos, setProductos] = useState([]);
    const [TempProductos, setTempProductos] = useState([]);
    const [NoResults, setNoResults] = useState(false);
    const [Query, setQuery] = useState('');
    const [BoxFilter, setBoxFilter] = useState(false);
    const [Restaurar, setRestaurar] = useState(false);
    const [Deleting, setDeleting] = useState(false);
    const [Id, setId] = useState(null);
    const [Aprobando, setAprobando] = useState(false);
    const [Loading, setLoading] = useState(true);
    // Monitor
    const [currentId, setCurrentId] = useState(null);
    const [EditInformation, setEditInformation] = useState([]);
    const [notSaved, setNotSaved] = useState(false);
    const [OnChangeRoute, setOnChangeRoute] = useState(false);
    const [NextRoute, setNextRoute] = useState(null);
    const [GoToNext, setGoToNext] = useState(false);
    const Route = useRouter();

    const { data: session } = useSession();

    useEffect(() => {
        if (Productos.length <= 0) {
            getProductos();
        }
        document.querySelector("body").className = '';
        document.querySelector("body").classList.add("consultas_bg");
        sessionHasExpired();
    }, []);

    useEffect(() => {
        const beforeRouteHandler = (url) => {
            if (url === Route.asPath) return;
            setOnChangeRoute(true);
            setNextRoute(url);
            if (!GoToNext) {
                Router.events.emit('routeChangeError');
                throw "Operaci??n cancelada";
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


    const getProductos = async () => {
        console.log(process.env.NEXTAUTH_URL)
        await axios(`https://lehren-productos.vercel.app/api/productos/all`).then((res) => {
            setProductos(res.data);
            setEditInformation(res.data)
            setTempProductos(res.data);
            setLoading(false);
        });
    }

    const search = (e) => {
        const searchText = e.target.value.trim().length <= 0 ? '' : e.target.value;
        setQuery(searchText);
        if (searchText.trim().length <= 0) return;
        let productos = [];
        Productos.map((field, index) => {
            if (field.nombre.toLowerCase().indexOf(searchText.toLowerCase()) > -1
                || field.institucion.toLowerCase().indexOf(searchText.toLowerCase()) > -1
                || field.creadoPor.toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
                productos.push(Productos[index]);
            }
        });

        if (productos.length <= 0) {
            setNoResults(true);
        } else {
            setNoResults(false);
        }
        setTempProductos(productos);
    }

    const filterFields = (e) => {
        e.preventDefault();
        const omitir = [];
        const temp = [];
        for (let i = 0; i <= 9; i++) {
            if (e.target[i].checked) {
                omitir.push(e.target[i].name);
            }
        }
        console.log(omitir)
        if (omitir.length <= 0) {
            toast.info("Filtro restaurado");
            setTempProductos(Productos);
            setRestaurar(false);
            return;
        }
        omitir.push("aprobado")
        Productos.map((student) => {
            temp.push(omit(student, omitir));
        });
        setTempProductos(temp);
        clearFilters(e);
        toast.success("Filtro aplicado");
        setRestaurar(true);
    }

    const clearFilters = (e) => {
        for (let i = 0; i <= 9; i++) {
            e.target[i].checked = false;
        }
    }

    const omit = (source = {}, omitKeys = []) => (
        Object.keys(source).reduce((output, key) => (
            omitKeys.includes(key) ? { ...output, [key]: source[key] } : output
        ), {})
    );

    // Funciones de editado

    const editFieldById = (index) => {
        setCurrentId(index);
    }

    const restoreFieldInfo = (id, index) => {
        setCurrentId(null);
        const inputs = document.getElementsByClassName(id);
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].value = TempProductos[index][inputs[i].name];
        }
        setNotSaved(false);
    }

    const saveInformationLocally = (index) => {
        const product = Productos[index];
        if (EditInformation.length <= 0) {
            toast.info("Ning??n dato se modific??")
            return;
        }
        for (let j in product) {
            if (product[j] !== EditInformation[j]) {
                product[j] = typeof EditInformation[j] === 'undefined' ? product[j] : EditInformation[j];
            }
        }
        const newModified = Productos;
        newModified[index] = product;
        setProductos(newModified);
        saveInformationToServer(newModified, index);
        setNotSaved(false);
    }

    const saveInformationToServer = async (data, index) => {
        let payload = data;
        payload[index] = {
            ...payload[index],
            lastUpdate: getTimeStamp(),
            modifiedBy: session.user.names
        }
        if (data[index].aprobado === 'on') {
            payload[index] = {
                ...payload[index],
                aprobadoPor: session.user.email
            }
        } else {
            payload[index] = {
                ...payload[index],
                aprobadoPor: 'No ha sido aprobado'
            }
        }
        const loadingId = toast.loading("Actualizando...");
        await axios.put(`https://lehren-productos.vercel.app/api/productos/` + payload[index]._id, payload[index])
            .then(() => {
                toast.success("Datos guardados");
                toast.dismiss(loadingId);
            })
        setEditInformation([]);
        setCurrentId(null);
    }

    const handleChange = (e) => {
        if (!notSaved) setNotSaved(true);
        setEditInformation({
            ...EditInformation,
            [e.target.name]: e.target.value
        });
    }

    const deleteProduct = async () => {
        await axios.delete(`https://lehren-productos.vercel.app/api/productos/` + Id)
            .then(() => {
                toast.success("Producto eliminado");
                getProductos();
            });
        setId(null);
        setDeleting(false);
        document.querySelector("body").style.overflow = "auto";
        setNotSaved(false);
    }

    const aprobarProduct = async (id) => {
        const payload = TempProductos.filter((item) => item._id === id)[0];
        payload.aprobado = payload.aprobado === 'on' ? 'off' : 'on';
        payload.aprobadoPor = session.user.names;
        payload.modifiedBy = session.user.names;
        payload.lastUpdate = getTimeStamp();
        const loadingId = toast.loading("Aprobando...");
        await axios.put(`https://lehren-productos.vercel.app/api/productos/` + id, payload)
            .then(() => {
                toast.success("Datos guardados");
                toast.dismiss(loadingId);
            });
        setId(null);
        setAprobando(false);
        document.querySelector("body").style.overflow = "auto";
        getProductos();
    }

    return <>
        <Head>
            <title>{!session ? 'Cargando...' : session.user.names} | Consultas </title>
            <meta name="description" content="Login app" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <Layout>
            {
                Productos.length <= 0 && !Loading ? <div className="badge_info">
                    <h1>No hay consultas</h1>
                    <img src="/img/sad.jpg" alt="" />
                    <NavLink href="/actions/producto">Carga tu primer producto</NavLink>
                </div> :
                    <>
                        <div className={Deleting || Aprobando || OnChangeRoute ? "wrapper_bg" : "wrapper_bg hide"} aria-hidden="true"></div>
                        <div className={styles.main_content}>
                        <h1>Consultas</h1>
                            <div className={Deleting ? "window_confirm" : "window_confirm hide"}>
                                <h1>??Eliminar producto?</h1>
                                <div className="cancel_continue">
                                    <button onClick={() => deleteProduct(Id)}>Continuar</button>
                                    <button onClick={() => ((setDeleting(false), setId(null), document.querySelector("body").style.overflow = "auto"))}>Cancelar</button>
                                </div>
                            </div>
                            <div className={Aprobando ? "window_confirm" : "window_confirm hide"}>
                                <h1>??Aprobar producto?</h1>
                                <div className="cancel_continue">
                                    <button onClick={() => aprobarProduct(Id)}>Aprobar</button>
                                    <button onClick={() => ((setAprobando(false), setId(null), document.querySelector("body").style.overflow = "auto"))}>Cancelar</button>
                                </div>
                            </div>
                            <div className={OnChangeRoute ? "window_confirm" : "window_confirm hide"}>
                                <h1 className="mini">??Seguro que quieres salir? Perder??s tu trabajo actual</h1>
                                <div className="cancel_continue">
                                    <button onClick={() => (setGoToNext(true), Route.push(NextRoute))}>Continuar</button>
                                    <button onClick={() => setOnChangeRoute(false)}>Cancelar</button>
                                </div>
                            </div>
                            <div className={styles.action_bar}>
                                <div className={styles.search} onSubmit={(e) => search(e)}>
                                    <label htmlFor="search" className={styles.search_icon}>
                                        {Query !== '' ?
                                            <AiOutlineClose
                                                className="btn"
                                                onClick={() => (setQuery(''), setNoResults(false), setTempProductos(Productos))} />
                                            : <BsSearch />}
                                    </label>
                                    <input
                                        type="text"
                                        name="search"
                                        id="search"
                                        placeholder="Busca registros por nombre, instituci??n o creador"
                                        onChange={(e) => search(e)}
                                        defaultValue={Query}
                                        value={Query} />
                                    {
                                        NoResults ?
                                            <span className={styles.alert_badge}>
                                                {Query.trim().length <= 0 ?
                                                    <>Escribe algo o <a onClick={() => (setTempProductos(Productos), setNoResults(false))}>restaura los datos</a></>
                                                    : <>No hay resultados para <b>{Query}</b></>}
                                            </span>
                                            : null
                                    }
                                </div>
                                <div className={styles.filters}>
                                    <button onClick={() => setBoxFilter(!BoxFilter)}>Filtrar campos</button>
                                    <div className={styles.fields_options + ' scroll'} style={BoxFilter ? { display: 'block' } : { display: 'none' }}>
                                        <form onSubmit={(e) => filterFields(e)}>
                                            <h1>Campos a visualizar</h1>
                                            <div className={styles.box_wrapper_checkbox}>
                                                <input type="checkbox" name="nombre" id="nombre" />
                                                <label htmlFor="nombre">Nombre del producto</label>
                                                <input type="checkbox" name="tipo" id="tipo" />
                                                <label htmlFor="tipo">Tipo de producto</label>
                                                <input type="checkbox" name="modalidad" id="modalidad" />
                                                <label htmlFor="modalidad">Modalidad</label>
                                                <input type="checkbox" name="areaV" id="areaV" />
                                                <label htmlFor="areaV">??rea vinculada</label>
                                                <input type="checkbox" name="razon" id="razon" />
                                                <label htmlFor="razon">Raz??n</label>
                                                <input type="checkbox" name="quienPropone" id="quienPropone" />
                                                <label htmlFor="quienPropone">Persona o ??rea que propone</label>
                                                <input type="checkbox" name="poblacionObj" id="poblacionObj" />
                                                <label htmlFor="poblacionObj">A qui??n va dirigido</label>
                                                <input type="checkbox" name="descripcion" id="descripcion" />
                                                <label htmlFor="descripcion">Descripci??n</label>
                                                <input type="checkbox" name="RVOE" id="RVOE" />
                                                <label htmlFor="RVOE">RVOE</label>
                                                <input type="checkbox" name="institucion" id="institucion" />
                                                <label htmlFor="institucion">Instituci??n</label>
                                            </div>
                                            {TempProductos.length <= 0 ?
                                                <button type="submit" onClick={() => (setBoxFilter(!BoxFilter), setTempProductos(Productos))}>
                                                    Restaurar datos
                                                </button>
                                                : <button type="submit" onClick={() => setBoxFilter(!BoxFilter)}>
                                                    {Restaurar ? 'Restaurar filtro' : 'Aplicar filtro'}
                                                </button>
                                            }
                                        </form>
                                    </div>
                                </div>
                            </div>
                            {
                                TempProductos.length <= 0 ? null :
                                    <table className={styles.table + " scroll"}>
                                        <thead>
                                            <tr>
                                                <th>No. </th>
                                                <th>Acciones </th>
                                                {TempProductos[0].nombre ? <th>Nombre del producto</th> : null}
                                                {TempProductos[0].tipo ? <th>Tipo de oferta</th> : null}
                                                {TempProductos[0].modalidad ? <th>Modalidad</th> : null}
                                                {TempProductos[0].areaV ? <th>??rea vinculada</th> : null}
                                                {TempProductos[0].quienPropone ? <th>Persona o ??rea que propone</th> : null}
                                                {TempProductos[0].razon ? <th>Raz??n</th> : null}
                                                {TempProductos[0].poblacionObj ? <th>Poblaci??n objetivo</th> : null}
                                                {TempProductos[0].descripcion ? <th>Descripci??n</th> : null}
                                                {TempProductos[0].RVOE ? <th>RVOE</th> : null}
                                                {TempProductos[0].institucion ? <th>Instituci??n</th> : null}
                                                {TempProductos[0].creadoPor ? <th>Creado por</th> : null}
                                                {TempProductos[0].aprobadoPor ? <th>Aprobado por</th> : null}
                                                {TempProductos[0].modifiedBy ? <th>Modificado por</th> : null}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                TempProductos.map((producto, index) => (
                                                    <tr key={index} className={index === currentId ? 'currentEditingTr' : null}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            {index !== currentId ? <div className={styles.action_by_id + " action_edit"}>
                                                                {
                                                                    producto.aprobado === 'on' ? <NavLink href={"/view/producto/" + producto._id} exact>
                                                                        <button>
                                                                            <AiOutlineEye />
                                                                        </button>
                                                                    </NavLink> :
                                                                        <button disabled>
                                                                            <AiOutlineEye />
                                                                        </button>
                                                                }

                                                                <button onClick={() => editFieldById(index)}>
                                                                    <AiTwotoneEdit />
                                                                </button>
                                                                <button
                                                                    onClick={() => (
                                                                        setDeleting(true),
                                                                        setId(producto._id),
                                                                        document.querySelector("body").style.overflow = "hidden")}>
                                                                    <AiFillDelete />
                                                                </button>
                                                                {
                                                                    producto.aprobado === 'on' ?
                                                                        <div className={styles.etapa2}>
                                                                            <NavLink href={"/actions/complete/" + producto._id} exact>
                                                                                Ir a etapa 2
                                                                            </NavLink>
                                                                        </div>
                                                                        :
                                                                        // Segunda verificacion de administrador
                                                                        session.user.rol === "administrador" && producto.aprobado === 'off' ?
                                                                            <div className={styles.etapa2} id="aprobado" onClick={() => (setAprobando(true),
                                                                                setId(producto._id),
                                                                                document.querySelector("body").style.overflow = "hidden")}>Aprobar</div>
                                                                            :
                                                                            <div className={styles.etapa2} id="aprobado">No aprobado</div>
                                                                }
                                                            </div> :
                                                                <>
                                                                    <button onClick={() => saveInformationLocally(index)} className="saveIcon">
                                                                        <AiOutlineSave />
                                                                    </button>
                                                                    <button onClick={() => restoreFieldInfo(producto._id, index)} className="closeIcon">
                                                                        <AiOutlineClose />
                                                                    </button>
                                                                </>
                                                            }
                                                        </td>
                                                        {producto.nombre ?
                                                            <td className="long">
                                                                <textarea 
                                                                name="nombre"
                                                                className={producto._id}
                                                                    placeholder={producto.nombre}
                                                                    disabled={index !== currentId ? true : false}
                                                                    autoComplete="off"
                                                                    onChange={(e) => handleChange(e)}></textarea>

                                                            </td> : null}
                                                        {producto.tipo ?
                                                            <td className="short">
                                                                <select name="tipo" className={producto._id} defaultValue={producto.tipo} disabled={index !== currentId ? true : false} onChange={(e) => handleChange(e)}>
                                                                    <option value="default">Tipo de oferta (nivel acad??mico)</option>
                                                                    <option value="asincronico">Curso asincr??nico</option>
                                                                    <option value="diplomado">Diplomado</option>
                                                                    <option value="especialidad">Especialidad</option>
                                                                    <option value="licenciatura">Licenciatura</option>
                                                                    <option value="maestria">Maestr??a</option>
                                                                    <option value="taller">Taller</option>
                                                                </select>
                                                            </td> : null}
                                                        {producto.modalidad ?
                                                            <td>
                                                                <select name="modalidad" defaultValue={producto.modalidad} disabled={index !== currentId ? true : false} onChange={(e) => handleChange(e)}>
                                                                    <option value="default">Modalidad de oferta</option>
                                                                    <option value="linea">En l??nea</option>
                                                                    <option value="mixto">Mixto</option>
                                                                    <option value="presencial">Presencial</option>
                                                                </select>
                                                            </td> : null}
                                                        {producto.areaV ?
                                                            <td>
                                                                <select name="areaV" defaultValue={producto.areaV} disabled={index !== currentId ? true : false} onChange={(e) => handleChange(e)}>
                                                                    <option value="default">??rea a la que se v??ncula</option>
                                                                    <option value="cinedigital">Cine digital</option>
                                                                    <option value="animacionefectos">Animaci??n y efectos visuales</option>
                                                                    <option value="comunicacion">Comunicaci??n</option>
                                                                    <option value="videojuegosD">Dise??o de videojuegos</option>
                                                                    <option value="audio">Ingenier??a de audio</option>
                                                                    <option value="musicB">Negocios de la m??sica</option>
                                                                    <option value="videojuegosP">Programaci??n de videojuegos</option>
                                                                </select>
                                                            </td> : null}
                                                        {producto.quienPropone ?
                                                            <td className="medium">
                                                                <input
                                                                    type="text"
                                                                    name="quienPropone"
                                                                    placeholder={producto.quienPropone}
                                                                    disabled={index !== currentId ? true : false}
                                                                    autoComplete="off"
                                                                    onChange={(e) => handleChange(e)} />
                                                            </td> : null}
                                                        {producto.razon ?
                                                            <td className="long">
                                                                <textarea
                                                                    name="razon"
                                                                    className="scroll"
                                                                    placeholder={producto.razon}
                                                                    disabled={index !== currentId ? true : false}
                                                                    autoComplete="off"
                                                                    onChange={(e) => handleChange(e)} />
                                                            </td> : null}
                                                        {producto.poblacionObj ?
                                                            <td className="long">
                                                                <input
                                                                    type="text"
                                                                    name="poblacionObj"
                                                                    placeholder={producto.poblacionObj}
                                                                    disabled={index !== currentId ? true : false}
                                                                    autoComplete="off"
                                                                    onChange={(e) => handleChange(e)} />
                                                            </td> : null}
                                                        {producto.descripcion ?
                                                            <td className="long">
                                                                <textarea
                                                                    name="descripcion"
                                                                    className="scroll"
                                                                    placeholder={producto.descripcion}
                                                                    disabled={index !== currentId ? true : false}
                                                                    autoComplete="off"
                                                                    onChange={(e) => handleChange(e)} />
                                                            </td> : null}
                                                        {producto.RVOE ?
                                                            <td>
                                                                {index !== currentId ?
                                                                    producto.RVOE === 'on' ? 'Tiene RVOE' : 'No tiene RVOE' :
                                                                    <>
                                                                        <input type="checkbox" name="RVOE" defaultChecked={producto.RVOE === 'on' ? true : false} onChange={(e) => handleChange(e)} />
                                                                    </>
                                                                }
                                                            </td> : null}
                                                        {producto.institucion ?
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    name="institucion"
                                                                    placeholder={producto.institucion}
                                                                    disabled={index !== currentId ? true : false}
                                                                    autoComplete="off"
                                                                    onChange={(e) => handleChange(e)} />
                                                            </td> : null}
                                                        {producto.creadoPor ?
                                                            <td className="long">
                                                                <input
                                                                    type="text"
                                                                    name="creadoPor"
                                                                    placeholder={producto.creadoPor}
                                                                    disabled={true}
                                                                    autoComplete="off" />
                                                            </td> : null}
                                                        {
                                                            producto.aprobadoPor ? <td className="medium">{producto.aprobadoPor}</td> : null
                                                        }
                                                        {
                                                            producto.modifiedBy ? <td className="long">
                                                                {producto.modifiedBy !== "Sin actualizaciones" ? <>{producto.modifiedBy}, el {producto.lastUpdate}</> : "No ha sido actualizado "}
                                                            </td> : null
                                                        }
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                            }

                        </div></>
            }


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