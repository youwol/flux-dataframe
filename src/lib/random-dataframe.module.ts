import { Context, BuilderView, Flux, Property, Schema, ModuleFlux, Pipe, freeContract
} from '@youwol/flux-core'
import {DataFrame, createEmptySerie, map} from '@youwol/dataframe'
import{pack} from './main'

/**
  ## Presentation

 A generator of dataframe with provided shape using random number generator in [0,1[
 */
export namespace ModuleRandomDataframe{

    let svgIcon = `<path xmlns="http://www.w3.org/2000/svg" d="M430.274,23.861H16.698C7.48,23.861,0,31.357,0,40.559v365.86c0,5.654,2.834,10.637,7.155,13.663v2.632h5.986   c1.146,0.252,2.332,0.401,3.557,0.401h413.576c1.214,0,2.396-0.149,3.545-0.401h0.821v-0.251   c7.082-1.938,12.336-8.362,12.336-16.044V40.564C446.977,31.357,439.478,23.861,430.274,23.861z M66,408.4H15.458   c-0.676-0.416-1.146-1.132-1.146-1.98v-43.35H66V408.4z M66,348.755H14.312v-47.01H66V348.755z M66,287.436H14.312v-49.632H66   V287.436z M66,223.491H14.312v-53.687H66V223.491z M66,155.49H14.312v-52.493H66V155.49z M186.497,408.4H80.318v-45.33h106.179   V408.4z M186.497,348.755H80.318v-47.01h106.179V348.755z M186.497,287.436H80.318v-49.632h106.179V287.436z M186.497,223.491   H80.318v-53.687h106.179V223.491z M186.497,155.49H80.318v-52.493h106.179V155.49z M186.497,88.68H80.318V38.17h106.179V88.68z    M308.195,408.4H200.812v-45.33h107.383V408.4z M308.195,348.755H200.812v-47.01h107.383V348.755z M308.195,287.436H200.812   v-49.632h107.383V287.436z M308.195,223.491H200.812v-53.687h107.383V223.491z M308.195,155.49H200.812v-52.493h107.383V155.49z    M308.195,88.68H200.812V38.17h107.383V88.68z M432.66,406.419c0,0.845-0.48,1.56-1.149,1.98h-109v-45.33H432.66V406.419z    M432.66,348.755H322.511v-47.01H432.66V348.755z M432.66,287.436H322.511v-49.632H432.66V287.436z M432.66,223.491H322.511   v-53.687H432.66V223.491z M432.66,155.49H322.511v-52.493H432.66V155.49z M432.66,88.68H322.511V38.17h107.764   c1.312,0,2.386,1.073,2.386,2.389V88.68z M175.854,276.251H89.938V246.37h85.915V276.251z M297.261,277.378h-85.915v-29.883h85.915   V277.378z M421.661,276.721h-85.914v-29.883h85.914V276.721z"/>`

    /**
     * ## Persistent Data  🔧
     *
     * Persisted attributes are the properties of the class.
     *
     */
    @Schema({
        pack
    })
    export class PersistentData {

        /**
         * Name of the dataframe. Default to 'Dataframe'.
         */
         @Property({
            description: "name of the dataframe",
            type:'integer'
        })
        name : string

        /**
         * Number of rows in the dataframe. Default to 100.
         */
        @Property({
            description: "number of rows",
            type:'integer'
        })
        rowCount : number

        /**
         * Number of elements in one Item. Default to 3.
         */
        @Property({
            description: "Number of elements in one Item. Default to 3.",
            type:'integer'
        })
        itemSize : number

        /**
         * Column names of the dataframe. Default is ['A', 'B', 'C'].
         */
        @Property({
            description: "the column names",
            type:'code'
        })
        columnNames : string | Array<string>

        getColumnNames() : Array<string> {

            if(Array.isArray(this.columnNames))
                return this.columnNames
            let array = new Function(this.columnNames)()
            return array
        }

        constructor({rowCount, itemSize, columnNames, name} :{rowCount?:number, itemSize?:number, columnNames?:string, name?:string}= {}) {

            this.rowCount = (rowCount != undefined) ? rowCount : 100
            this.columnNames = (columnNames != undefined) ? columnNames : "return ['A','B','C']"
            this.itemSize = (itemSize != undefined) ? itemSize : 3
            this.name = (name != undefined) ? name : "Dataframe"
        }
    }

    /** ## Module
     *
     * Documentation of the module is presented [[ ModuleRandomDataframe | here]]
     */
    @Flux({
        pack: pack,
        namespace: ModuleRandomDataframe,
        id: "ModuleRandomDataframe",
        displayName: "Rnd DF ",
        description: "A generator of dataframe with provided shape using random number generator in [0,1[",
        resources: {
            'technical doc': `${pack.urlCDN}/dist/docs/modules/lib_module_random_dataframe.modulerandomdataframe.html`
        }
    })
    @BuilderView({
        namespace: ModuleRandomDataframe,
        icon: svgIcon
    })
    export class Module extends ModuleFlux {

        /**
         * This is the output, you can use it to emit messages using *this.result$.next(...)*.
         *
         */
        output$ : Pipe<DataFrame>

        constructor( params ){
            super(params)

            this.addInput({
                id:'input',
                description: 'No data expected, only configuration are used from incoming messages',
                contract: freeContract(),
                onTriggered: ({data, configuration, context}) => this.emitDataframe(configuration, context)
            })
            this.output$ = this.addOutput({id:'output'})
            this.emitDataframe(this.getPersistentData<PersistentData>())
        }

        /**
        * Processing function triggered when a message is received
        */
         emitDataframe( configuration: PersistentData, context?: Context ) {

            let rndSerie = () => {
                let s = createEmptySerie({
                    Type: Float32Array, 
                    count:configuration.rowCount, itemSize:configuration.itemSize, shared: true 
                })
                return map(s, (items) => items.map( () => Math.random()) )
            }
            let data = configuration.getColumnNames().reduce( 
                (acc,e) => ({
                    ...acc, 
                    [e]: rndSerie()
                }), 
                {}
            )

            const df = new DataFrame(data,  { name: configuration.name } )
            this.output$.next({data:df,context})
        }
    }

}