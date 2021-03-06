import Head from 'next/head';
import { AiOutlineFileSearch, AiOutlineFolderAdd } from "react-icons/ai";
import { MdPersonAdd } from "react-icons/md";
import { NavLink } from '../components/NavLink';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ADMIN, STAFF } from '../utils/roles';
import Layout from '../components/Layout';
import styles from "../styles/pages/inicio.module.scss";
import { sessionHasExpired } from '../utils/forms';

export default function Home() {
  const [Interface, setInterface] = useState([]);
  const { data } = useSession();

  useEffect(() => {
    if (!data) return;
    setRolInterface();
    document.querySelector("body").className = '';
    document.querySelector("body").classList.add("menu");
    sessionHasExpired();
  }, []);

  const setRolInterface = () => {
    switch (data.user.rol) {
      case 'administrador':
        ADMIN[1].icono = <AiOutlineFileSearch className="icon_button" />;
        ADMIN[0].icono = <AiOutlineFolderAdd className="icon_button" />;
        ADMIN[2].icono = <MdPersonAdd className="icon_button" />;
        setInterface(ADMIN);
        break;
      case 'staff':
        STAFF[1].icono = <AiOutlineFileSearch className="icon_button" />;
        STAFF[0].icono = <AiOutlineFolderAdd className="icon_button" />;
        setInterface(STAFF);
        break;
      case 'docente':
        STAFF[1].icono = <AiOutlineFileSearch className="icon_button" />;
        STAFF[0].icono = <AiOutlineFolderAdd className="icon_button" />;
        setInterface(STAFF);
        break;
      default:
        console.error("ALGO SALIÓ TERRIBLEMENTE MAL. COMPRA OTRA PC")
        break;
    }
  }

  return (
    <>
      <Head>
        <title>Inicio</title>
        <meta name="description" content="Start app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <div className={styles.quest_next}>
          <h1>Inicio</h1>
          <div className={styles.options}>
            {
              Interface.map((item, index) => (
                <NavLink href={item.link} key={index}>
                  {item.icono}
                  <span>{item.texto}</span>
                </NavLink>

              ))
            }
          </div>
        </div>
      </Layout>
    </>
  )
}
