import { registerBlockType } from '@wordpress/blocks'; // register block
import { __ } from '@wordpress/i18n'; 
import {
    InspectorControls,
    useBlockProps
} from '@wordpress/block-editor'; //import block editor components
import {
    PanelBody,
    TextControl,
    SelectControl
} from '@wordpress/components'; // import UI Components
import { useState, useEffect } from '@wordpress/element'; // Import react hooks
import apiFetch from '@wordpress/api-fetch'; // fetch data Rest API

registerBlockType('dmg/read-more', { // register block type
    title: __('DMG Read More', 'dmg-read-more'),
    icon: 'admin-links',
    category: 'widgets',
    attributes: { // Attribute to store selected post
        postId: { type: 'number', default: 0 },
        postTitle: { type: 'string', default: '' },
        postLink: { type: 'string', default: '' }
    },
    edit: (props) => {
        const { attributes, setAttributes } = props;
        const [searchTerm, setSearchTerm] = useState('');
        const [posts, setPosts] = useState([]);
        const [isLoading, setIsLoading] = useState(false);

        // Function to fetch posts based on search term
        const fetchPosts = (search = '') => {
            setIsLoading(true);
            apiFetch({ path: `/wp/v2/posts?search=${search}` })   // fetch posts from REST API
                .then((posts) => {
                    setPosts(posts);
                    setIsLoading(false);
                })
                .catch(() => {
                    setPosts([]);
                    setIsLoading(false);
                });
        };
        // useEffect to fetch posts
        useEffect(() => {
            fetchPosts(searchTerm);
        }, [searchTerm]);

        const blockProps = useBlockProps();
        // below is inspector control for block settings
        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Post Settings', 'dmg-read-more')}>
                        <TextControl
                            label={__('Search Post', 'dmg-read-more')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            help={__('Search for a post by title or content.', 'dmg-read-more')}
                        />
                        <SelectControl
                            label={__('Select a Post', 'dmg-read-more')}
                            value={attributes.postId}
                            options={posts.map((post) => ({ label: post.title.rendered, value: post.id }))}
                            onChange={(postId) => {
                                const selectedPost = posts.find((post) => post.id == postId);
                                setAttributes({
                                    postId: selectedPost.id,
                                    postTitle: selectedPost.title.rendered,
                                    postLink: selectedPost.link
                                });
                            }}
                            disabled={isLoading}
                        />
                    </PanelBody>
                </InspectorControls>
                <div {...blockProps}>
                    <p className="dmg-read-more">
                        {attributes.postId ? `Read More: ` : ''}
                        <a href={attributes.postLink}>{attributes.postTitle}</a>
                    </p>
                </div>
            </>
        );
    },
    save: (props) => {
        const blockProps = useBlockProps.save(); // get block props for save function
        return (
            <p {...blockProps} className="dmg-read-more">
                Read More: <a href={props.attributes.postLink}>{props.attributes.postTitle}</a>
            </p>
        );
    }
});
