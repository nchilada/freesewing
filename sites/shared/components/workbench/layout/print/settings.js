import PageSizePicker from './pagesize-picker'
import OrientationPicker from './orientation-picker'
import PrintIcon from 'shared/components/icons/print'
import RightIcon from 'shared/components/icons/right'
import ClearIcon from 'shared/components/icons/clear'
import ExportIcon from 'shared/components/icons/export'
import { useTranslation } from 'next-i18next'

const PrintLayoutSettings = props => {
  if (!props.draft?.parts?.pages?.pages) return null
  const { cols, rows, count } = props.draft.parts.pages.pages
  const { t } = useTranslation(['workbench'])

  const setMargin = (evt) => {
    props.updateGist(['_state', 'layout', 'forPrinting', 'page', 'margin'], parseInt(evt.target.value))
  }

  const setCoverPage = () => {
    props.updateGist(['_state', 'layout', 'forPrinting', 'page', 'coverPage'], !props.layoutSettings.coverPage)
  }


  return (
    <div >
      <div className="flex flex-row justify-between
      mb-2">
        <div className="flex gap-4">
          <PageSizePicker {...props} />
          <OrientationPicker {...props} />
        </div>
        <div className="flex gap-4">
          <button
            key="export"
            onClick={props.exportIt}
            className="btn btn-primary btn-outline"
            disabled={count === 0}
            aria-disabled={count === 0}>
            <ExportIcon className="h-6 w-6 mr-2"/>
            {t('export')}
          </button>
          <button
            key="reset"
            onClick={() => props.unsetGist(['layouts', 'printingLayout'])}
            className="btn btn-primary btn-outline">
            <ClearIcon className="h-6 w-6 mr-2"/>
            {t('reset')}
          </button>
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <label htmlFor="pageMargin" className="label mr-6">
            <span className="mr-2">{t('pageMargin')}</span>
            <input
              type="range"
              max={50}
              min={0}
              step={1}
              onChange={setMargin}
              value={props.layoutSettings.margin}
              className="range range-sm mx-2"
              name="pageMargin"
            />
            <div className="text-center">
              <span className="text-secondary">
                {props.layoutSettings.margin}mm
              </span>
            </div>
            <button
              title={t('reset')}
              className="btn btn-ghost btn-xs text-accent mx-2"
              disabled={props.layoutSettings.margin == 10}
              onClick={() => setMargin({target: {value: 10}})}
            >
              <ClearIcon />
            </button>
          </label>
          <label htmlFor="coverPage" className="label">
            <span className="mr-2">{t('coverPage')}</span>
            <input type="checkbox" className="toggle toggle-primary" checked={props.layoutSettings.coverPage} onChange={setCoverPage}/>
          </label>
        </div>
        <div className="flex flex-row font-bold items-center px-0 text-xl">
          <PrintIcon />
          <span className="ml-2">{count}</span>
          <span className="mx-6 opacity-50">|</span>
          <RightIcon />
          <span className="ml-2">{cols}</span>
          <span className="mx-6 opacity-50">|</span>
          <div className="rotate-90"><RightIcon /></div>
          <span className="text-xl ml-2">{rows}</span>
        </div>
      </div>
    </div>
  )
}

export default PrintLayoutSettings
