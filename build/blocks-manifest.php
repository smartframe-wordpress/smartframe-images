<?php
// This file is generated. Do not modify it manually.
return array(
	'smartframe-images-block' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'create-block/smartframe-image',
		'version' => '0.1.0',
		'title' => 'SmartFrame',
		'category' => 'media',
		'description' => 'Embed images for free from SmartFrame Image Library',
		'example' => array(
			
		),
		'supports' => array(
			'html' => false,
			'align' => array(
				'left',
				'right',
				'center'
			)
		),
		'textdomain' => 'smartframe-image',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:../tailwind.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php',
		'viewScript' => 'file:./view.js',
		'attributes' => array(
			'embedCode' => array(
				'type' => 'string',
				'default' => ''
			),
			'embed' => array(
				'type' => 'boolean',
				'default' => false
			),
			'customerId' => array(
				'type' => 'string',
				'default' => ''
			),
			'imageId' => array(
				'type' => 'string',
				'default' => ''
			),
			'imageWidth' => array(
				'type' => 'number'
			),
			'imageHeight' => array(
				'type' => 'number'
			),
			'maxWidth' => array(
				'type' => 'number',
				'default' => null
			)
		)
	)
);
