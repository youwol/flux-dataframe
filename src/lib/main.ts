import { DataFrame, IArray, Serie } from '@youwol/dataframe'
import { FluxPack, IEnvironment, Journal } from '@youwol/flux-core'
import { AUTO_GENERATED } from '../auto_generated'
import { dataframeJournalView } from './dataframe.view'

export function install(environment: IEnvironment){
    Journal.registerView({
        name:'Dataframe @ flux-dataframe',
        description:'Journal view to display dataframe',
        isCompatible: (data:unknown) => {
            let ok = data instanceof DataFrame || data instanceof Serie
            return ok
        },
        view: (df: DataFrame | Serie<IArray>) => {

            return dataframeJournalView(df) as any
        }
    })
    return
}

export let pack = new FluxPack({
    ...AUTO_GENERATED,
    ...{
        install
    }
})

