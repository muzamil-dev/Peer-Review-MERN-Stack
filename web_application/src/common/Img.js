import { Box, Skeleton } from '@mui/material';
export const Img = (props) => {
    if (props.src) {
        return <Box
            component='img'
            style={{ overflow: 'hidden'}}
            borderRadius={1}
            sx={{ boxShadow: 1 }}
            { ...props }
        />;
    }
    else {
        // Use skeleton to load page faster if images are taking too long
        return <Skeleton variant='rectangular' animation='wave'
            {...props}
            height={props.height ?? props.style?.height ?? props.expectedHeight ?? 64}
            width={props.width ?? props.style?.width ?? props.expectedWidth ?? 64}
        />
    }
};