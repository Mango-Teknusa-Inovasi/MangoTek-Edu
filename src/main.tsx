import React,{lazy,Suspense,useEffect,useState} from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import './styles.css';
import './cms/cms.css';
import {api} from './cms/client';
import {PortalProvider} from './cms/PortalContext';
import type {PortalContent,DocumentRecord} from './cms/schema';
const App=lazy(()=>import('./App'));
const Office=lazy(()=>import('./cms/Office'));
const News=lazy(()=>import('./cms/News'));
const Products=lazy(()=>import('./cms/Products'));
const ProductPreview=lazy(()=>import('./cms/Products').then(m=>({default:m.ProductView})));
const ArticlePreview=lazy(()=>import('./cms/News').then(m=>({default:m.ArticleView})));
function Root(){
 const [content,setContent]=useState<PortalContent|null>(null),[preview,setPreview]=useState<DocumentRecord|null>(null),[error,setError]=useState('');
 const office=location.pathname==='/office',previewId=location.pathname.startsWith('/office/preview/')?location.pathname.split('/').pop():null;
 useEffect(()=>{if(office)return;api('/api/portal').then(setContent).catch(e=>setError(e.message));if(previewId)api('/api/office/documents').then((docs:DocumentRecord[])=>{const d=docs.find(d=>d.id===previewId);if(!d)throw Error('Konten tidak ditemukan.');setPreview(d);}).catch(e=>setError(e.message));},[]);
 if(office)return <Suspense fallback={<p className="loading-page">Memuat office…</p>}><Office/></Suspense>;
 if(error)return <main className="loading-page"><h1>Portal belum dapat dimuat</h1><p role="alert">{error}</p><button onClick={()=>location.reload()}>Coba lagi</button></main>;
 if(!content||(previewId&&!preview))return <p className="loading-page" role="status">Memuat portal…</p>;
 return <PortalProvider content={preview?.kind==='portal'?preview.draft as PortalContent:content}>{preview&&<div className="preview-banner">Pratinjau draf — belum diterbitkan. <a href="/office">Kembali ke office</a></div>}<Suspense fallback={<p className="loading-page">Memuat halaman…</p>}>{preview?.kind==='product'?<main className="container news-page"><ProductPreview product={preview.draft as any}/></main>:preview?.kind==='article'?<main className="container news-page"><ArticlePreview article={preview.draft as any}/></main>:location.pathname.startsWith('/produk')?<Products/>:location.pathname.startsWith('/berita')?<News/>:<App/>}</Suspense></PortalProvider>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
