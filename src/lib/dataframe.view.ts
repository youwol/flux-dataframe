import { DataFrame, IArray, Serie } from "@youwol/dataframe";
import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { BehaviorSubject, combineLatest, Observable } from "rxjs";
import { map } from "rxjs/operators";


function rowHeader(index: number){

    let indexView = (i) =>{
        if(i<1e6){
            return { 
                class: 'px-1',
                style:{'white-space': 'nowrap'},
                innerText: i
            }
        }
        return { 
            class: 'px-1',
            style:{'white-space': 'nowrap'},
            innerText: i.toExponential(3)
        }
    }
    return { 
        tag: 'td', 
        class: 'px-3 py-2 border fv-bg-background-alt',
        style:{fontFamily:"fantasy"},
        children:[{
            class:'d-flex',
            children: [indexView(index)],
        }]
    }
}

function cellView(data: IArray){

    let numberView = (r) =>({ 
        class: 'px-1',
        style:{'white-space': 'nowrap'},
        innerText: r.toExponential(2)
    })
    return { 
        tag: 'td', 
        class: 'px-3',
        children:[{
            class:'d-flex justify-content-around',
            children: Array.isArray(data) ? data.map( d =>numberView(d)) : [ numberView(data) ],
        }]
    }
}

export function tableView(
    columns: Array<string>, 
    chunk$: Observable<any>
    ){

    return {
        tag: 'table',
        class: 'fv-color-primary text-center w-100 fv-text-primary',
        style: {
            //tableLayout: 'fixed',
            borderCollapse: 'collapse'
        },
        children: [
            {
                tag: 'thead',
                children: [
                    {
                        tag: 'tr', class: 'fv-bg-background-alt', 
                        style:{
                            fontFamily:'fantasy'
                        },
                        children: [
                            { tag: 'th', innerText: '', class: 'px-2 fv-bg-background-alt', 
                            style:{width:'50px'} },
                            ...columns.map((col: string) => {
                                return { tag: 'td', innerText: col, class: 'px-2 border py-1' }
                            })]
                    }
                ]
            },
            child$(
                chunk$,
                (chunk) => {
                    return {
                        tag: 'tbody',
                        children: chunk.map( (row,i) => {

                            return {
                                tag: 'tr',
                                class: 'fv-hover-bg-background-alt border py-2' /*+ ( i%2 ? 'fv-bg-background-alt' : 'fv-bg-background')*/,
                                style: {
                                    fontFamily:'math'
                                },
                                children: [rowHeader(row[0][0])].concat(row.slice(1).map((data) => cellView(data)))
                            }
                        })
                    }
                }
            )
        ]
    }
}

export function dataFrameView(df: DataFrame): VirtualDOM {

    let startIndex$ = new BehaviorSubject(0)

    let rowHeight = 36
    let windowRowCount = window.screen.height / rowHeight
    let bufferSize$ = new BehaviorSubject(windowRowCount)
    
    let columns = Array.from(Object.keys(df.series))
    let chunk$ = combineLatest([startIndex$, bufferSize$]).pipe(
        map(([startIndex, bufferSize]) => {
            
            let series : Serie<IArray>[]= columns.reduce((acc, name) => [...acc, df.series[name]], [])
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
            {
                class: 'flex-grow-1 overflow-auto w-100', 
                style: { 'min-height': '0px' },
                onscroll: (ev) => {
                    startIndex$.next(Math.floor(ev.target.scrollTop / rowHeight))
                },
                children: [
                    {
                        style:{
                            height: `${(df.series[columns[0]].count + 2 ) *rowHeight }px`,
                            position:'relative'
                        },
                        children:[
                            {
                                class:'w-100',
                                style:{
                                    position:'sticky',
                                    left:'0px',
                                    top:'0px',
                                    pointerEvents: 'none'
                                },
                                children:[
                                    tableView(columns, chunk$)
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
}

export function dataframeJournalView(df: DataFrame | Serie<IArray>) {

    if(df instanceof Serie){
        df = DataFrame.create({ series:{'Serie':df}})
    }
    let view = dataFrameView(df)
    view.style["max-height"] = "400px"
    return view
}
