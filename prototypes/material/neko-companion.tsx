import {useEffect,useRef,useState} from 'react';
import {Button,Popover,PopoverTrigger,PopoverSurface} from '@fluentui/react-components';
import {CatIcon} from './idle-cat';
import {createNeko} from './neko-actor';

export default function NekoCompanion() {
  const [enabled,setEnabled]=useState(true);
  const [open,setOpen]=useState(false);
  const actorRef=useRef<ReturnType<typeof createNeko>|null>(null);
  useEffect(()=>{
    if(!enabled)return;
    const media=matchMedia('(prefers-reduced-motion:reduce)');
    let actor=createNeko(media.matches);
    actorRef.current=actor;
    const reset=()=>{actor.destroy();actor=createNeko(media.matches);actorRef.current=actor};
    media.addEventListener('change',reset);
    return()=>{actor.destroy();actorRef.current=null;media.removeEventListener('change',reset)};
  },[enabled]);
  return <div className="cat-preference" data-cat-control><Popover open={open} onOpenChange={(_,data)=>setOpen(data.open)} positioning={{position:'below',align:'end',offset:8}}><PopoverTrigger disableButtonEnhancement><button type="button" className="cat-toggle" aria-label="Кошка" data-enabled={enabled} title="Кошка: настройки и реакция на гол"><CatIcon/><span>Кошка</span><i aria-hidden="true"/></button></PopoverTrigger><PopoverSurface className="neko-settings"><h2>Кошка на льду</h2><p>Гоняет шайбу и отвлекается на курсор. Подтолкните шайбу курсором или нажмите на кошку, чтобы погладить.</p><Button appearance="primary" disabled={!enabled} onClick={()=>{actorRef.current?.goal();setOpen(false)}}>Показать реакцию на гол</Button><small>Демонстрация · счёт матча не изменится</small><Button appearance="subtle" onClick={()=>{setEnabled(value=>!value);setOpen(false)}}>{enabled?'Спрятать кошку':'Показать кошку'}</Button></PopoverSurface></Popover></div>;
}
