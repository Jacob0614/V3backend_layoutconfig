export interface ThemeCatalogItem {
  id: string;
  label: string;
  sites: string[];
  buttonColor: string;
  background: string;
  primaryButton: string;
  secondaryButton: string;
  buttonRadius: string;
  buttonShape: string;
  designForm: string;
  source: string;
}

const sourceRoot = 'source-materials/current-product/C端源碼/ar_v2_vue/src/assets';
const tbd = 'TBD／來源未定義';

const rawThemeCatalog: ThemeCatalogItem[] = [
  { id: 'redStyle', label: 'redStyle', sites: ['ar003', 'ar005', 'ar006', 'ar007', 'ar012', 'ar013', 'ar014', 'ar021', 'ar025', 'ar027', 'ar036', 'ar037', 'ar048', 'ar050', 'ar052', 'ar059', 'ar2014', 'arpay002', 'arpay003', 'demonstration', 'dev', 'kakaclub', 'okwin', 'private', 'reddemo', 'sit', 'sitvnd', 'vesoB', 'worktrak', 'xiaoer'], buttonColor: '#f95959', background: '#F7F8FF', primaryButton: 'linear-gradient(90deg, #f95959 0%, #ff9a8e 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋紅色漸層', source: `${sourceRoot}/redStyle/root.scss` },
  { id: 'red92Style', label: 'red92Style', sites: ['ar001', 'ar030', 'ar040', 'ar043', 'ar044', 'ar045', 'ar046', 'red92demo'], buttonColor: '#f2413b', background: '#F7F8FF', primaryButton: 'linear-gradient(90deg, #ce0204 0%, #f2403a 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋紅色漸層', source: `${sourceRoot}/red92Style/root.scss` },
  { id: 'redNewStyle', label: 'redNewStyle', sites: ['ar070', 'ar075'], buttonColor: '#F74747', background: '#F5F6FF', primaryButton: 'linear-gradient(90deg, #FF8E8A 0%, #FE6868 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋紅色漸層', source: `${sourceRoot}/redNewStyle/root.scss` },
  { id: 'blackRedStyle', label: 'blackRedStyle', sites: ['ar096'], buttonColor: '#FA484C', background: '#2C0001', primaryButton: 'linear-gradient(90deg, #FF8E89 0%, #FFC3A2 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋紅色漸層', source: `${sourceRoot}/blackRedStyle/root.scss` },
  { id: 'blackElectronicStyle', label: 'blackElectronicStyle', sites: ['ar038'], buttonColor: '#FA2367', background: '#0E131B', primaryButton: 'linear-gradient(90deg, #D92E08 15.38%, #BE026A 98.73%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋紅紫漸層', source: `${sourceRoot}/blackElectronicStyle/root.scss` },
  { id: 'blueStyle', label: 'blueStyle', sites: ['ar004', 'ar033', 'ar035', 'ar047', 'bluedemo', 'lotto'], buttonColor: '#4781ff', background: '#F7F8FF', primaryButton: 'linear-gradient(90deg, #4782ff 0%, #59adff 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋藍色漸層', source: `${sourceRoot}/blueStyle/root.scss` },
  { id: 'lightBlueStyle', label: 'lightBlueStyle', sites: [], buttonColor: '#6EC9DF', background: '#F7F8FF', primaryButton: 'linear-gradient(90deg, #6ED0F6 0%, #6FC7D5 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋淺藍漸層／來源未對應站點', source: `${sourceRoot}/lightBlueStyle/root.scss` },
  { id: 'damanBlueStyle', label: 'damanBlueStyle', sites: ['ar002', 'ar009', 'ar010', 'ar032', 'ar051'], buttonColor: '#61a9ff', background: '#22275B', primaryButton: 'linear-gradient(90deg, #2AAAF3 0%, #2979F2 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋藍色漸層', source: `${sourceRoot}/damanBlueStyle/root.scss` },
  { id: 'deepBlueStyle', label: 'deepBlueStyle', sites: ['ar019'], buttonColor: '#F5CC2C', background: '#001534', primaryButton: 'linear-gradient(180deg, #F5CC2C -.23%, #F2CA33 99.78%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋金黃色漸層', source: `${sourceRoot}/deepBlueStyle/root.scss` },
  { id: 'roseRedStyle', label: 'roseRedStyle', sites: ['ar082'], buttonColor: '#1A8CFF', background: '#F2F2F1', primaryButton: 'linear-gradient(90deg, #0069EA 0%, #75C1FF 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋藍色漸層', source: `${sourceRoot}/roseRedStyle/root.scss` },
  { id: 'greenStyle', label: 'greenStyle', sites: ['ar011', 'ar015', 'ar016', 'ar055', 'ar056', 'ar060', 'ar066'], buttonColor: '#06B36A', background: '#F2F2F1', primaryButton: 'linear-gradient(90deg, #49C755 0%, #0F9957 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋綠色漸層', source: `${sourceRoot}/greenStyle/root.scss` },
  { id: 'green1Style', label: 'green1Style', sites: ['ar029', 'ar034', 'ar062', 'ar067', 'ar085'], buttonColor: '#1AB266', background: '#F2F2F1', primaryButton: 'linear-gradient(90deg, #3BAF4C 0%, #00D08A 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋綠色漸層', source: `${sourceRoot}/green1Style/root.scss` },
  { id: 'electronJadeStyle', label: 'electronJadeStyle', sites: ['ar071'], buttonColor: '#00997A', background: '#F2F2F1', primaryButton: 'linear-gradient(90deg, #2FD6B4 0%, #00997A 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋玉綠漸層', source: `${sourceRoot}/electronJadeStyle/root.scss` },
  { id: 'cyanbBlueStyle', label: 'cyanbBlueStyle', sites: ['ar086'], buttonColor: '#00ECBE', background: '#05012B', primaryButton: 'linear-gradient(90deg, #04B3B6 0%, #00ECBE 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋青綠漸層', source: `${sourceRoot}/cyanbBlueStyle/root.scss` },
  { id: 'goldWStyle', label: 'goldWStyle', sites: ['ar017', 'ar020', 'ar041', 'ar042', 'ar078'], buttonColor: '#B1835A', background: '#F7F8FF', primaryButton: 'linear-gradient(90deg, #D9AD82 0%, #B1835A 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋金棕漸層', source: `${sourceRoot}/goldWStyle/root.scss` },
  { id: 'blackGoldStyle', label: 'blackGoldStyle', sites: ['ar015', 'ar016', 'ar055', 'ar056', 'ar097'], buttonColor: '#d9ac4f', background: '#242424', primaryButton: 'linear-gradient(90deg, #FAE59F 0%, #C4933F 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋黑金漸層', source: `${sourceRoot}/blackGoldStyle/root.scss` },
  { id: 'p5BlackGoldStyle', label: 'p5BlackGoldStyle', sites: ['ar064', 'ar079'], buttonColor: '#FED358', background: '#110D14', primaryButton: 'TBD／依 main-gradient-start/end', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋金色漸層', source: `${sourceRoot}/p5BlackGoldStyle/root.scss` },
  { id: 'p5WhiteGoldStyle', label: 'p5WhiteGoldStyle', sites: ['ar091'], buttonColor: '#F9BB0B', background: '#F5F6FF', primaryButton: 'TBD／依 main-gradient-start/end', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋金色漸層', source: `${sourceRoot}/p5WhiteGoldStyle/root.scss` },
  { id: 'p5EmeraldGreenStyle', label: 'p5EmeraldGreenStyle', sites: ['ar088'], buttonColor: '#1AB266', background: '#F2F2F2', primaryButton: 'TBD／依 main-gradient-start/end', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋翡翠綠漸層', source: `${sourceRoot}/p5EmeraldGreenStyle/root.scss` },
  { id: 'public5WhiteGreen', label: 'public5WhiteGreen', sites: ['ar095'], buttonColor: '#0CD781', background: '#F2F2F1', primaryButton: 'linear-gradient(90deg, #0CD781 0%, #00E989 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋白綠漸層', source: `${sourceRoot}/public5WhiteGreen/root.scss` },
  { id: 'public6WriteGreen', label: 'public6WriteGreen', sites: ['ar092'], buttonColor: '#006B23', background: '#F2F2F1', primaryButton: 'linear-gradient(90deg, #0DDA50 0%, #006B23 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋綠色漸層', source: `${sourceRoot}/public6WriteGreen/root.scss` },
  { id: 'public8WhiteBlue', label: 'public8WhiteBlue', sites: ['ar094'], buttonColor: '#488FFD', background: '#F2F2F1', primaryButton: 'linear-gradient(90deg, #36FFBB 0%, #488FFD 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋白藍漸層', source: `${sourceRoot}/public8WhiteBlue/root.scss` },
  { id: 'public7PurpleBlack', label: 'public7PurpleBlack', sites: ['ar093'], buttonColor: '#A08FFF', background: '#1A1A2C', primaryButton: 'linear-gradient(90deg, #FB8466 0%, #BD5BD4 33%, #7473FA 66%, #53B2FA 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋多色漸層', source: `${sourceRoot}/public7PurpleBlack/root.scss` },
  { id: 'public073Style', label: 'public073Style', sites: ['ar073'], buttonColor: '#02457C', background: '#F4FAFF', primaryButton: 'linear-gradient(90deg, #02457C 0%, #02457C 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋深藍', source: `${sourceRoot}/public073Style/root.scss` },
  { id: 'public3Style', label: 'public3Style', sites: ['ar029', 'ar058', 'ar062', 'ar063', 'ar064', 'ar065', 'ar066', 'ar069', 'ar072', 'ar080', 'ar087', 'sassdemo'], buttonColor: 'rgb(7, 221, 209)', background: '#15131E', primaryButton: 'linear-gradient(90deg, #21D9CC 0%, #BED921 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋青綠漸層', source: `${sourceRoot}/public3Style/root.scss` },
  { id: 'public3Yellow', label: 'public3Yellow', sites: ['ar072'], buttonColor: 'rgb(240,150,14)', background: '#1A1918', primaryButton: 'linear-gradient(90deg, #F5B73B 0%, #F5853B 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋橙金漸層', source: `${sourceRoot}/public3Yellow/root.scss` },
  { id: 'public3Dmwin', label: 'public3Dmwin', sites: ['ar065'], buttonColor: '#29BEFF', background: '#121314', primaryButton: 'linear-gradient(90deg, #29BEFF 0%, #059AFF 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋藍色漸層', source: `${sourceRoot}/public3Dmwin/root.scss` },
  { id: 'public3Pink', label: 'public3Pink', sites: ['ar089'], buttonColor: 'rgba(245, 124, 123, 1)', background: '#100C0C', primaryButton: 'linear-gradient(90deg, #FF8080 0%, #FCD4B5 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋粉紅漸層', source: `${sourceRoot}/public3Pink/root.scss` },
  { id: 'public3Purple', label: 'public3Purple', sites: ['ar076'], buttonColor: '#F390F7', background: '#F2F2F1', primaryButton: 'linear-gradient(246deg, #F390F7 15.38%, #7894FF 84.62%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋紫藍漸層', source: `${sourceRoot}/public3Purple/root.scss` },
  { id: 'public3BdgRedGold', label: 'public3BdgRedGold', sites: ['ar098'], buttonColor: '#902A32', background: '#240005', primaryButton: 'linear-gradient(90deg, #AE8639 0%, #F6E3A3 50%, #D2A753 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋紅金漸層', source: `${sourceRoot}/public3BdgRedGold/root.scss` },
  { id: 'public3Style6', label: 'public3Style6', sites: ['ar058', 'ar063', 'ar087', 'sassdemo'], buttonColor: 'rgb(67, 109, 244)', background: '#EBF2FB', primaryButton: 'linear-gradient(90deg, #434FEE 0%, #4183F8 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋藍色漸層', source: `${sourceRoot}/public3Style6/root.scss` },
  { id: 'goGameStyle', label: 'goGameStyle', sites: ['ar009', 'ar026', 'ar068'], buttonColor: '#558EEB', background: '#0E131B', primaryButton: 'linear-gradient(90deg, #374992 0%, #4675D2 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋藍色漸層', source: `${sourceRoot}/goGameStyle/root.scss` },
  { id: 'goGameRedStyle', label: 'goGameRedStyle', sites: [], buttonColor: '#FB5755', background: '#F7F8FF', primaryButton: 'linear-gradient(90deg, #F54545 0%, #FF7C7C 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋紅色漸層', source: `${sourceRoot}/goGameRedStyle/root.scss` },
  { id: 'okwin2Style', label: 'okwin2Style', sites: ['ar077'], buttonColor: '#00ECBE', background: '#05012B', primaryButton: 'TBD／依 main-gradient-start/end', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋青綠漸層', source: `${sourceRoot}/okwin2Style/root.scss` },
  { id: 'mysticPurpleStyle', label: 'mysticPurpleStyle', sites: ['ar060'], buttonColor: 'rgb(125, 200, 255)', background: '#121618', primaryButton: 'linear-gradient(90deg, #80D4FF 0%, #EA80FF 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋藍紫漸層', source: `${sourceRoot}/mysticPurpleStyle/root.scss` },
  { id: 'mysteriousPurple', label: 'mysteriousPurple', sites: ['ar090'], buttonColor: '#7DC8FF', background: '#121618', primaryButton: 'linear-gradient(90deg, #80D4FF 0%, #EA80FF 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋藍紫漸層', source: `${sourceRoot}/mysteriousPurple/root.scss` },
  { id: 'purpleStyle', label: 'purpleStyle', sites: ['ar022'], buttonColor: '#9A2CE3', background: '#F2F2F1', primaryButton: 'linear-gradient(90deg, #D46DFC 0%, #882EC4 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋紫色漸層', source: `${sourceRoot}/purpleStyle/root.scss` },
  { id: 'orangeStyle', label: 'orangeStyle', sites: [], buttonColor: '#ED8A1F', background: '#F7F8FF', primaryButton: 'linear-gradient(90deg, #FF9A02 0%, #E67302 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋橙色漸層／來源未對應站點', source: `${sourceRoot}/orangeStyle/root.scss` },
  { id: 'rajaStyle', label: 'rajaStyle', sites: ['ar008'], buttonColor: '#F3BD0B', background: '#380A09', primaryButton: 'linear-gradient(90deg, #F9CA0E 0%, #FC9D10 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '深色＋金橙漸層', source: `${sourceRoot}/rajaStyle/root.scss` },
  { id: 'yellow1Style', label: 'yellow1Style', sites: ['ar023', 'ar031', 'ar039', 'ar074', 'ar081'], buttonColor: '#F5CC2C', background: '#F2F2F1', primaryButton: 'linear-gradient(90deg, #F5CC2C 0%, #F2CA33 100%)', secondaryButton: tbd, buttonRadius: tbd, buttonShape: tbd, designForm: '淺色＋黃色漸層', source: `${sourceRoot}/yellow1Style/root.scss` },
];

const sourceSecondaryColorByTheme: Record<string, string> = {
  redStyle: '#FEAA57',
  red92Style: '#FEAA57',
  redNewStyle: '#FEAA57',
  blackRedStyle: '#FEAA57',
  blackElectronicStyle: '#FEAA57',
  blueStyle: '#FEAA57',
  lightBlueStyle: '#FEAA57',
  damanBlueStyle: '#DD9138',
  deepBlueStyle: '#DD9138',
  roseRedStyle: '#FEAA57',
  greenStyle: '#FEAA57',
  green1Style: '#FEAA57',
  electronJadeStyle: '#FEAA57',
  cyanbBlueStyle: '#FEAA57',
  goldWStyle: '#FEAA57',
  blackGoldStyle: '#DD9138',
  p5BlackGoldStyle: '#DD9138',
  p5WhiteGoldStyle: '#F5A036',
  p5EmeraldGreenStyle: '#F5A036',
  public5WhiteGreen: '#F5A036',
  public6WriteGreen: '#FEAA57',
  public8WhiteBlue: '#FEAA57',
  public7PurpleBlack: '#FEAA57',
  public073Style: '#FEAA57',
  public3Style: '#DD9138',
  public3Yellow: '#DD9138',
  public3Dmwin: '#DD9138',
  public3Pink: '#DD9138',
  public3Purple: '#FEAA57',
  public3BdgRedGold: '#DD9138',
  public3Style6: '#FEAA57',
  goGameStyle: '#DD9138',
  goGameRedStyle: '#FEAA57',
  okwin2Style: '#DD9138',
  mysticPurpleStyle: '#DD9138',
  mysteriousPurple: '#DD9138',
  purpleStyle: '#FEAA57',
  orangeStyle: '#FEAA57',
  rajaStyle: '#CA893D',
  yellow1Style: '#FEAA57',
};

const sourcePrimaryGradientByTheme: Record<string, string> = {
  p5BlackGoldStyle: 'linear-gradient(90deg, #FED358 0%, #FFB472 100%)',
  p5WhiteGoldStyle: 'linear-gradient(90deg, #FFDD1A 0%, #FFB05B 100%)',
  p5EmeraldGreenStyle: 'linear-gradient(90deg, #3BAF4C 0%, #00D08A 100%)',
  okwin2Style: 'linear-gradient(90deg, #7AFEC3 0%, #02AFB6 100%)',
};

// Source reset files contain component-level radius values, not one global theme token.
const sourceButtonRadiusEvidenceByTheme: Record<string, string> = {
  redStyle: '來源未設全局值／依元件', red92Style: '來源值：0', redNewStyle: '來源值：30px', blackRedStyle: '來源值：30px',
  blackElectronicStyle: '來源未設全局值／依元件', blueStyle: '來源未設全局值／依元件', lightBlueStyle: '來源未設全局值／依元件', damanBlueStyle: '來源未設全局值／依元件', deepBlueStyle: '來源未設全局值／依元件',
  roseRedStyle: '來源值：30px／20px／8px', greenStyle: '來源未設全局值／依元件', green1Style: '來源未設全局值／依元件', electronJadeStyle: '來源值：78px／12px／0／8px', cyanbBlueStyle: '來源值：30px／20px／8px',
  goldWStyle: '來源值：0 0 16px 16px', blackGoldStyle: '來源值：10px／.26667rem', p5BlackGoldStyle: '來源值：20px／8px／4px', p5WhiteGoldStyle: '來源值：20px／8px／4px／16px', p5EmeraldGreenStyle: '來源值：20px／16px／8px',
  public5WhiteGreen: '來源值：20px／50px／14px／24px', public6WriteGreen: '來源值：14px／24px', public8WhiteBlue: '來源值：70px／50px／14px／24px', public7PurpleBlack: '來源值：50px／14px／24px', public073Style: '來源值：78px／12px',
  public3Style: '來源未設全局值／依元件', public3Yellow: '來源值：16px', public3Dmwin: '來源未設全局值／依元件', public3Pink: '來源值：16px', public3Purple: '來源值：99rem／40px／0 0 16px 16px',
  public3BdgRedGold: '來源值：99rem／58px／20px／12px／10px／8px／6px／5px／4px', public3Style6: '來源未設全局值／依元件', goGameStyle: '來源未設全局值／依元件', goGameRedStyle: '來源未設全局值／依元件', okwin2Style: '來源值：20px',
  mysticPurpleStyle: '來源未設全局值／依元件', mysteriousPurple: '來源值：16px', purpleStyle: '來源值：0 0 16px 16px／40px／0', orangeStyle: '來源未設全局值／依元件', rajaStyle: '來源值：0／10px', yellow1Style: '來源值：78px／12px',
};

const sourceButtonShapeEvidence = '依元件定義／無全局單一形狀';

export const themeCatalog: ThemeCatalogItem[] = rawThemeCatalog.map((theme) => ({
  ...theme,
  primaryButton: sourcePrimaryGradientByTheme[theme.id] || theme.primaryButton,
  secondaryButton: sourceSecondaryColorByTheme[theme.id] || theme.secondaryButton,
  buttonRadius: sourceButtonRadiusEvidenceByTheme[theme.id] || theme.buttonRadius,
  buttonShape: sourceButtonShapeEvidence,
}));

export const themeOptions = themeCatalog.map((theme) => ({ label: theme.label, value: theme.id }));
