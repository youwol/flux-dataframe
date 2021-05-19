import { DataFrame, IArray, Serie } from "@youwol/dataframe";
import { child$, VirtualDOM } from "@youwol/flux-view";
import { BehaviorSubject, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { ModuleTablesView } from "./tables-view.module";



function optionsView(
    startIndex$: BehaviorSubject<number>, 
    bufferSize$:  BehaviorSubject<number>
    ): VirtualDOM{
    
    let elem = (subject$, title) => {
        return {
            class: 'd-flex p-2 align-items-center',
            children: [
                {
                    innerText: title
                },
                {
                    tag: 'input',
                    class: 'mx-2',
                    type: 'number',
                    value: subject$.getValue(),
                    onchange: (ev) => subject$.next(parseInt(ev.target.value))
                }
            ]
        }
    }
    return {
        class: 'd-flex p-2 align-items-center',
        children: [
            elem(startIndex$, 'start'),
            elem(bufferSize$, 'buffer'),
        ]
    }
}

function cellView(data: IArray, options){

    let numberView = (r) =>({ 
        class: 'px-1',
        style:{'white-space': 'nowrap'},
        innerText: r.toExponential(2)
    })
    return { 
        tag: 'td', 
        class: 'px-3',
        children:[{
            class:'d-flex',
            children: Array.isArray(data) ? data.map( d =>numberView(d)) : [ numberView(data) ],
        }]
    }
}


export function dataFrameView(df: DataFrame): VirtualDOM {

    let startIndex$ = new BehaviorSubject(0)
    let bufferSize$ = new BehaviorSubject(100)
    
    let columns = Array.from(df.series.keys())
    let chunk$ = combineLatest([startIndex$, bufferSize$]).pipe(
        map(([startIndex, bufferSize]) => {
            
            let series : Serie<IArray>[]= columns.reduce((acc, name) => [...acc, df.get(name)], [])
            let totalRowCount = series[0].length / series[0].itemSize
            if(startIndex+bufferSize > totalRowCount)
                bufferSize = totalRowCount - startIndex

            let chunk = [...new Array(bufferSize)].map((_, rowIndex) => {
                let values = series.map((serie: Serie<IArray>) => serie.itemAt(startIndex + rowIndex))
                return [ [startIndex + rowIndex], ...values]
            })
            return chunk
        })
    )
    return {
        class: 'd-flex flex-column h-100 w-100 fv-bg-background fv-text-primary',
        style:{},
        children: [
            optionsView(startIndex$, bufferSize$),
            {
                class: 'flex-grow-1 overflow-auto w-100', style: { 'min-height': '0px' },
                children: [
                    {
                        tag: 'table',
                        class: 'fv-color-primary text-center h-100 w-100 fv-text-primary',
                        children: [
                            {
                                tag: 'thead',
                                children: [
                                    {
                                        tag: 'tr', class: 'fv-bg-background-alt',
                                        children: [
                                            { tag: 'td', innerText: '', class: 'px-2' },
                                            ...columns.map((col: string) => {
                                                return { tag: 'td', innerText: col, class: 'px-2' }
                                            })]
                                    }
                                ]
                            },
                            child$(
                                chunk$,
                                (chunk) => {
                                    return {
                                        tag: 'tbody',
                                        children: chunk.map(row => {

                                            return {
                                                tag: 'tr',
                                                class: 'fv-hover-bg-background-alt',
                                                children: row.map((data) => cellView(data, {}))
                                            }
                                        })
                                    }
                                }
                            )
                        ]
                    }
                ]

            }
        ]
    }
}

export function dataframeJournalView(df: DataFrame | Serie<IArray>) {

    if(df instanceof Serie){
        df = new DataFrame({'Serie':df})
    }
    let view = dataFrameView(df)
    view.style["max-height"] = "400px"
    return view
}
