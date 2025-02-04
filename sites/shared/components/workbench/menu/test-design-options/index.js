import OptionsIcon from 'shared/components/icons/options.js'
import { Chevron } from 'shared/components/navigation/primary.js'
import OptionGroup from '../design-options/option-group'
import Option from './option'
import { Ul, Details, TopSummary, TopSumTitle } from 'shared/components/workbench/menu'
import { useTranslation } from 'next-i18next'
import { optionsMenuStructure } from 'shared/utils.mjs'
import { adult, doll, giant } from '@freesewing/models'

const groups = { adult, doll, giant }

const SampleDesignOption = props => {
  const { t } = useTranslation(['app'])

  return <Option
    updateGist={props.updateGist}
    option={props.option}
    design={props.design}
    active={props.gist.sample?.option}
    label={t(`o_${props.design.config.data.name}:${props.option}.t`)}
    sampleSettings={{type: 'option', option: props.option}}
  />
}

const DesignOptions = props => {
  const { t } = useTranslation(['app'])
  const optionsMenu = optionsMenuStructure(props.design.config.options)

  const measies = props.draft?.config?.measurements || []

  return (
    <>
    <Details open>
      <TopSummary icon={<OptionsIcon />}>
        <TopSumTitle>{t('designOptions')}</TopSumTitle>
        <Chevron />
      </TopSummary>
      <Ul className="pl-5 list-inside">
        {Object.entries(optionsMenu).map(([group, options]) => typeof options === "string"
          ? <Option {...props} type={options} option={group} key={group} sampleSettings={{ type: 'option', option}}/>
          : <OptionGroup {...props} group={group} options={options} key={group} Option={SampleDesignOption}/>
        )}
      </Ul>
    </Details>

    <Details open>
      <TopSummary icon={<OptionsIcon />}>
        <TopSumTitle>{t('measurements')}</TopSumTitle>
        <Chevron />
      </TopSummary>
      <Ul className="pl-5 list-inside">
        {measies.map(m => <Option
          updateGist={props.updateGist}
          option={m}
          design={props.design}
          active={props.gist.sample?.option}
          key={m}
          label={m}
          sampleSettings={{ type: 'measurement', measurement: m }}
        />)}
      </Ul>
    </Details>

    <Details open>
      <TopSummary icon={<OptionsIcon />}>
        <TopSumTitle>{t('models')}</TopSumTitle>
        <Chevron />
      </TopSummary>
      <Ul className="pl-5 list-inside">
        {Object.entries(groups).map(([group, modelGroups]) => (
          Object.entries(modelGroups).map(([name, models]) => <Option
            updateGist={props.updateGist}
            label={`${group} - ${name}`}
            design={props.design}
            active={props.gist.sample?.option}
            key={name}
            sampleSettings={{ type: 'models', models }}
          />
        )))}
      </Ul>
    </Details>
    </>
  )
}

export default DesignOptions
