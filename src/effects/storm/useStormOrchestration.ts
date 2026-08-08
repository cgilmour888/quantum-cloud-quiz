/**
 * Owner Authorities: QCQ-TBL-030 / QCQ-TBL-070
 * Purpose: visibility/intersection-aware React adapter around the one-timer storm runtime.
 */
import {useEffect,useMemo,useRef,useState,type RefObject} from 'react';
import {StormOrchestrationEngine} from './StormOrchestrationEngine';
import {StormRuntimeController} from './StormRuntimeController';
import type {QuizFinaleRequest,StormDecision,StormMotion,StormQuality} from './StormOrchestration.types';

export interface UseStormOrchestrationOptions {
  readonly active:boolean;
  readonly seed:string;
  readonly rootRef:RefObject<HTMLElement|null>;
  readonly motion:StormMotion;
  readonly quality:StormQuality;
  readonly finale:QuizFinaleRequest|null;
  readonly onDecision:(decision:StormDecision)=>void;
}

export function useStormOrchestration(options:UseStormOrchestrationOptions):void {
  const previousFinaleIdRef=useRef<string|null>(null);
  const [pageVisible,setPageVisible]=useState(
    ()=>typeof document==='undefined'?true:!document.hidden,
  );
  const [onscreen,setOnscreen]=useState(true);
  const engine=useMemo(
    ()=>new StormOrchestrationEngine(options.seed,0),
    [options.seed],
  );
  const controller=useMemo(
    ()=>new StormRuntimeController(engine,{
      onDecision:options.onDecision,
    }),
    [engine,options.onDecision],
  );

  useEffect(()=>{
    engine.beginGameplay(Date.now());
  },[engine]);

  useEffect(()=>{
    if(typeof document==='undefined') return undefined;
    const listener=():void=>setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange',listener);
    return ()=>document.removeEventListener('visibilitychange',listener);
  },[]);

  useEffect(()=>{
    const root=options.rootRef.current;
    if(root===null||typeof IntersectionObserver==='undefined'){
      return undefined;
    }
    const observer=new IntersectionObserver(
      (entries)=>setOnscreen(entries[0]?.isIntersecting??true),
      {rootMargin:'200px'},
    );
    observer.observe(root);
    return ()=>observer.disconnect();
  },[options.rootRef]);

  useEffect(()=>{
    controller.setPresentation(options.motion,options.quality);
    controller.setVisibility(pageVisible,onscreen);
  },[controller,onscreen,options.motion,options.quality,pageVisible]);

  useEffect(()=>{
    if(options.finale!==null){
      previousFinaleIdRef.current=options.finale.quizId;
      controller.startFinale(options.finale);
      return;
    }
    if(previousFinaleIdRef.current!==null){
      previousFinaleIdRef.current=null;
      controller.beginNextQuiz();
    }
  },[controller,options.finale]);

  useEffect(()=>{
    if(options.active) controller.start();
    else controller.stop();
    return ()=>controller.dispose();
  },[controller,options.active]);
}
