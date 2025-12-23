import {ReactComponent as MailIcon} from '../MaterialIcons/mail.svg'
import {ReactComponent as CloseIcon} from '../MaterialIcons/close.svg'
import {ReactComponent as ExpandIcon} from '../MaterialIcons/expand.svg'
import {ReactComponent as AccSettingsIcon} from '../MaterialIcons/acc_settings.svg'
import {ReactComponent as PersonAddIcon} from '../MaterialIcons/person_add.svg'
import {ReactComponent as RefreshIcon} from '../MaterialIcons/refresh.svg'
import {ReactComponent as SettingsIcon} from '../MaterialIcons/settings.svg'
import {ReactComponent as UnExpandIcon} from '../MaterialIcons/unexpand.svg'
import {ReactComponent as HeartIcon} from '../MaterialIcons/heart.svg'
import {ReactComponent as PersonDelIcon} from '../MaterialIcons/person_del.svg'
import {ReactComponent as HeartFilledIcon} from '../MaterialIcons/heart-filled.svg'
import {ReactComponent as CommentIcon} from '../MaterialIcons/comment.svg'
import {ReactComponent as DeleteIcon} from '../MaterialIcons/delete.svg'
import {ReactComponent as EditIcon} from '../MaterialIcons/edit.svg'
import {ReactComponent as OpenNewIcon} from '../MaterialIcons/openNew.svg'
import {ReactComponent as ClearAllIcon} from '../MaterialIcons/clearAll.svg'


export default function Icons({iconName}) {


    const IconsList = [
        {
            name: 'mail',
            icon: <MailIcon />
        },
        {
            name: 'close',
            icon: <CloseIcon />
        },
        {
            name: 'expand',
            icon: <ExpandIcon />
        },
        {
            name: 'acc_settings',
            icon: <AccSettingsIcon />
        },
        {
            name: 'person_add',
            icon: <PersonAddIcon />
        },
        {
            name: 'refresh',
            icon: <RefreshIcon />
        },
        {
            name: 'settings',
            icon: <SettingsIcon />
        },
        {
            name: 'unexpand',
            icon: <UnExpandIcon />
        },
        {
            name: 'heart',
            icon: <HeartIcon />
        },
        {
            name: 'person_del',
            icon: <PersonDelIcon />
        },
        {
            name: 'heart-filled',
            icon: <HeartFilledIcon />
        },
        {
            name: 'comment',
            icon: <CommentIcon />
        },
        {
            name: 'delete',
            icon: <DeleteIcon />
        },
        {
            name: 'edit',
            icon: <EditIcon />
        },
        {
            name: 'openNew',
            icon: <OpenNewIcon />
        },
        {
            name: 'clearAll',
            icon: <ClearAllIcon />
        }
    ]

    const displayIcon = iconName ? 
     IconsList.find(icon => icon.name === iconName)
     : null

    return (
        <span className='material-icons'>
            {displayIcon.icon ? displayIcon.icon : null}
        </span>
    )
      
}